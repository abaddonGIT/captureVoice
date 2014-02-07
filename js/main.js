/******************************************************
 * Copyright 2014 by Abaddon <abaddongit@gmail.com>
 * @author Abaddon <abaddongit@gmail.com> 
 * @version 0.0.1
 * ***************************************************/
var d = document,
    w = window;


var Voice = (function () {
    var context = null,
        voice = null,
        vocoderOptions = [],
        filters = [],
        analyser = null,
        source = [],
        currentSource = null,
        node = null,
        dest = null,
        arrayGrainSizes = [256, 512, 1024, 2048, 4096, 8192],
        sources = null,
        audioEl = null,
        filePut = null,
        locBuffer = null,
        currentGrainSize = arrayGrainSizes[1],
        managerBut = null,
        loadingArray = ["effects/gettysburg.ogg", "effects/breath.ogg", "effects/reverb.wav"];

    var sourceGain = null,
        sourceType = 1,
        startOffset = 0,
        startTime = 0,
        ringGain = null,
        currentShiftRatio = 0.77,
        currentOverLap = 0.50,
        ringCarrier = null;
    /*
    * Прелодер
    */
    var loder = (function () {
        var loadEl = null;

        var start = function () {
            if (!loadEl) {
                loadEl = d.querySelector("#loading");
            }
            loadEl.style.display = 'block';
        };

        var stop = function () {
            loadEl.style.display = "none";
        };

        return {
            start: start,
            stop: stop
        }
    } ());
    /*
    * Выбирается источник звучания
    */
    var init = function () {
        try {
            var audioContext = w.audioContext || w.webkitAudioContext;
            navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
            context = new audioContext();
            dest = context.destination;
            //Создаем анализатор
            analyser = context.createAnalyser();
            analyser.smoothingTimeConstant = 0.3;
            analyser.fftSize = 512;
            //Иницыализируем канву
            initCanvas.init(d.querySelector("#target"));
            initAudio(sourceType);
            setOptions();
            bindEvent();
        } catch (e) {
            throw (e.message);
        }
    };
    var bindEvent = function () {
        var playBut = function () {
            managerBut.setAttribute('data-type', 'play');
            managerBut.innerHTML = 'play';
            managerBut.removeAttribute('disabled');
        },
        stopBut = function () {
            managerBut.setAttribute('data-type', 'stop');
            managerBut.innerHTML = 'stop';
            managerBut.setAttribute('disabled');
        }
        //Громкость
        vocoderOptions['voice-gain']['el'].addEventListener('change', function () {
            sourceGain.gain.value = this.value;
            vocoderOptions['voice-gain']['value'] = this.value;
        }, false);

        //Настройки несущего сигнала
        vocoderOptions['detune']['el'].addEventListener('change', function () {
            ringCarrier.detune.value = this.value;
            vocoderOptions['detune']['value'] = this.value;
            this.parentNode.querySelector('b').innerHTML = this.value;
        }, false);

        vocoderOptions['сarrier-gain']['el'].addEventListener('change', function () {
            ringGain.gain.setValueAtTime(this.value, 0);
            vocoderOptions['сarrier-gain']['value'] = this.value;
            this.parentNode.querySelector('b').innerHTML = this.value;
        }, false);

        //изменение тона
        vocoderOptions['pitchShift']['el'].addEventListener('change', function () {
            currentShiftRatio = this.value * 1;
            vocoderOptions['pitchShift']['value'] = this.value;
            this.parentNode.querySelector('b').innerHTML = this.value;
        }, false);
        vocoderOptions['overLap']['el'].addEventListener('change', function () {
            currentOverLap = this.value * 1;
            vocoderOptions['overLap']['value'] = this.value;
            this.parentNode.querySelector('b').innerHTML = this.value;
        }, false);

        //Эквалайзер
        Object.keys(filters).forEach(function (item, i, array) {
            filters[item]['el'].addEventListener('change', function () {
                var name = this.name;
                filters[name]['gain'].value = this.value;
                filters[name]['value'] = this.value;
                this.parentNode.querySelector('b').innerHTML = this.value;
            }, false);
        });

        //Кнопки остановки и воспроизведениея
        managerBut.addEventListener('click', function () {
            var type = this.getAttribute('data-type');

            switch (type) {
                case "stop":
                    if (sourceType === 1) {
                        source[sourceType].stop(0);
                        ringCarrier.noteOff(0);
                        startOffset += context.currentTime - startTime;
                    }
                    if (sourceType === 3) {
                        audioEl.pause();
                    }
                    this.setAttribute('data-type', 'play');
                    this.innerHTML = 'play';
                    break;
                case "play":
                    if (sourceType === 1) {
                        initAudio(1);
                        source[sourceType].start(0, startOffset);
                    }
                    if (sourceType === 3) {
                        audioEl.play();
                    }
                    this.setAttribute('data-type', 'stop');
                    this.innerHTML = 'stop';
                    break;
            }
        }, false);

        //Смена источника сигнала
        var ln = sources.length;
        while (ln--) {
            var loc = sources[ln];
            loc.addEventListener('click', function () {
                var val = this.value * 1,
                    type = this.type;

                sourceType = val;
                startOffset = 0;
                startTime = 0;

                switch (val) {
                    case 1:
                        initAudio(1);
                        playBut();
                        break;
                    case 2:
                        stopBut();
                        initAudio(2);
                        break;
                }
                filePut.value = null;
                audioEl.src = null;
                audioEl.load();
            }, false);
        }
        //подгрузка внешнего файла
        filePut.addEventListener('change', function () {
            var fReader = new FileReader();
            managerBut.setAttribute('disabled');
            fReader.readAsDataURL(this.files[0]);
            fReader.onloadend = function (event) {
                var e = event || w.event;
                audioEl.src = e.target.result;
                audioEl.load();
                sourceType = 3;
                playBut();
                initAudio(3);
            };
        }, false);
    };
    /*
    * Заполняем массив с опциями дефолтовыми значениями и 
    */
    var setOptions = function () {
        var optionsSel = d.querySelectorAll('input.vocoder-option'),
            ln = optionsSel.length;

        sources = d.querySelectorAll('input.changeSourse');
        audioEl = d.querySelector("audio");
        managerBut = d.querySelector("#playManagment");
        filePut = d.querySelector('input[type=file]');

        //Заполняем массив дефолтовыми значениями
        while (ln--) {
            var name = optionsSel[ln].name,
                value = optionsSel[ln].value;

            if (name.indexOf('filter') !== -1) {
                var fr = name.split('_');
                filters[name] = {
                    el: optionsSel[ln],
                    name: name,
                    frequency: fr[1] * 1,
                    value: value * 1
                };
            } else {
                vocoderOptions[name] = {
                    el: optionsSel[ln],
                    name: name,
                    value: value * 1
                };
            }
        }
    };

    var initAudio = function (type, bufferSize) {
        var modular = null;
        bufferSize = bufferSize || 1;
        //врубаем прелодер
        loder.start();
        if (node) {
            node.disconnect();
            currentSource.disconnect();
        }
        node = context.createScriptProcessor(arrayGrainSizes[bufferSize], 1, 1);
        switch (type) {
            case 1: //Локальный файл
                if (locBuffer) {
                    source[type] = context.createBufferSource();
                    source[type].buffer = locBuffer[0];
                    source[type].loop = false;
                    var modular = new AudioModulation(locBuffer, source[type]);
                    currentSource = source[type];
                    loder.stop();
                } else {
                    var bufferLoader = new BufferLoader(context, loadingArray, function (buffers) {
                        if (!source[type]) {
                            source[type] = context.createBufferSource();
                            source[type].buffer = buffers[0];
                            source[type].loop = false;
                            currentSource = source[type];
                        }
                        var modular = new AudioModulation(buffers, source[type]);
                        loder.stop();
                        locBuffer = buffers;
                    });
                    bufferLoader.load();
                }
                break;
            case 2: //стрим
                navigator.getMedia({ audio: true }, function (striam) {
                    if (!source[type]) {
                        source[type] = context.createMediaStreamSource(striam);
                    }
                    loder.stop();
                    var modular = new AudioModulation(locBuffer, source[type]);
                    currentSource = source[type];
                }, function (e) {
                    alert(e);
                    loder.stop();
                });
                break;
            case 3: //Подгруженный файл
                if (!source[type]) {
                    source[type] = context.createMediaElementSource(audioEl);
                }
                loder.stop();
                var modular = new AudioModulation(locBuffer, source[type]);
                currentSource = source[type];
                break;
        }
    };
    /*
    * Тут творится черная магия и издевательства над сигналом
    */
    var AudioModulation = function (buffers, source) {
        var am = this;
        //Подключаем анализатор на прослушку сигнала
        analyser.connect(node);
        //Общий усилитель
        sourceGain = context.createGain();
        sourceGain.gain.value = vocoderOptions['voice-gain']['value'];
        //Свертка сигнала с дорожкой для создания эффекта реверберации
        var sourceConvolver = context.createConvolver();
        sourceConvolver.buffer = buffers[2];
        //Добавляем возможность регулировки громкости для сигнала с которым делается свертка
        var sourceConvolverGain = context.createGain();
        sourceConvolverGain.gain.value = 1;
        sourceConvolver.connect(sourceConvolverGain);
        //Добавляем компрессор частот
        var sourceCompressor = context.createDynamicsCompressor();
        sourceCompressor.threshold.value = -18.2;
        sourceCompressor.ratio.value = 5;
        //Соединение всех частей графа
        source.connect(sourceGain);
        sourceGain.connect(analyser);
        sourceGain.connect(sourceConvolverGain);
        //Кольцевая модуляци
        var ringGain = this.ringModulation();
        sourceConvolverGain.connect(ringGain);
        ringGain.connect(sourceCompressor);
        var outFilters = this.setFilters(sourceCompressor);

        outFilters.connect(dest);
        node.connect(dest);
        startTime = context.currentTime;
        node.grainWindow = this.hannWindow(currentGrainSize);
        node.buffer = new Float32Array(currentGrainSize * 2);

        var k = 0;

        node.onaudioprocess = function (event) {
            var array = new Uint8Array(analyser.frequencyBinCount);

            var input = event.inputBuffer.getChannelData(0);
            output = event.outputBuffer.getChannelData(0),
                ln = input.length;

            for (i = 0; i < ln; i++) {

                // Apply the window to the input buffer
                input[i] *= this.grainWindow[i];

                // Shift half of the buffer
                this.buffer[i] = this.buffer[i + currentGrainSize];

                // Empty the buffer tail
                this.buffer[i + currentGrainSize] = 0.0;
            }

            // Calculate the pitch shifted grain re-sampling and looping the input
            var grainData = new Float32Array(currentGrainSize * 2);
            for (var i = 0, j = 0.0; i < currentGrainSize; i++, j += currentShiftRatio) {
                var index = Math.floor(j) % currentGrainSize;
                var a = input[index];
                var b = input[(index + 1) % currentGrainSize];
                grainData[i] += am.linearInterpolation(a, b, j % 1.0) * this.grainWindow[i];
            }

            // Copy the grain multiple times overlapping it
            for (i = 0; i < currentGrainSize; i += Math.round(currentGrainSize * (1 - currentOverLap))) {
                for (j = 0; j <= currentGrainSize; j++) {
                    this.buffer[i + j] += grainData[j];
                }
            }

            // Output the first half of the buffer
            for (i = 0; i < currentGrainSize; i++) {
                output[i] = this.buffer[i];
            }

            analyser.getByteFrequencyData(array);
            initCanvas.draw(array);
            k++;
        }
    };
    AudioModulation.prototype.hannWindow = function (length) {
        var window = new Float32Array(length);
        for (var i = 0; i < length; i++) {
            window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (length - 1)));
        }
        return window;
    };
    AudioModulation.prototype.linearInterpolation = function (a, b, t) {
        return a + (b - a) * t;
    };
    /*
    * Реализация кольцевой модуляции
    */
    AudioModulation.prototype.ringModulation = function () {
        ringGain = context.createGain();
        ringGain.gain.setValueAtTime(vocoderOptions['сarrier-gain']['value'], 0);
        //Несущий сигнал
        ringCarrier = context.createOscillator();
        ringCarrier.type = ringCarrier.SINE;
        ringCarrier.frequency.setValueAtTime(40, 0);
        ringCarrier.detune.value = vocoderOptions['detune']['value'];

        var ngHigpass = context.createBiquadFilter();
        ngHigpass.type = ngHigpass.HIGHPASS;
        ngHigpass.frequency.value = 10;
        ringCarrier.connect(ngHigpass);
        ngHigpass.connect(ringGain.gain);
        ringCarrier.noteOn(0, startOffset);
        return ringGain;
    };
    /*
    * Добавляем эквалайзер
    */
    AudioModulation.prototype.setFilters = function (source) {
        var filterGain = context.createGain(), out = null;

        Object.keys(filters).forEach(function (item, i, array) {
            var currFilter = null;
            currFilter = context.createBiquadFilter();
            currFilter.type = currFilter.HIGHSHELF;
            currFilter.gain.value = filters[item]['value'];
            currFilter.Q.value = 1;
            currFilter.frequency.value = filters[item]['frequency'];

            if (!out) {
                source.connect(currFilter);
                out = currFilter;
            } else {
                out.connect(currFilter);
                out = currFilter;
            }

            filters[item]['gain'] = currFilter.gain;
        });
        return out;
    };
    /*
    * Отвечает за канву
    */
    var initCanvas = (function () {
        var ctx = null,
           canva = null;

        var init = function (el) {
            el = el || d.body;
            canva = d.createElement("canvas");
            ctx = canva.getContext("2d");
            canva.width = 1000;
            canva.height = 250;
            el.appendChild(canva);
        };

        var draw = function (array) {
            var ln = array.length;
            ctx.clearRect(0, 0, canva.width, canva.height);

            ctx.fillStyle = '#F6D565';
            ctx.lineCap = 'round';
            null
            for (var i = 0; i < ln; ++i) {
                var magnitude = 0;
                var loc = array[i];
                ctx.fillStyle = "hsl( " + Math.round((i * 360) / Math.round(canva.width / 2)) + ", 100%, 50%)";
                ctx.fillRect(i * 5, canva.height, 3, -loc);
            }
        };

        return {
            init: init,
            draw: draw
        };
    } ());

    return {
        init: init
    };
} ());

w.addEventListener('DOMContentLoaded', Voice.init, false);