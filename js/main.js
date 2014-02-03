var d = document,
    w = window;

w.onload = function () {
    var AudioTrap = function () {
        var trap = this,
            context = null,
            canva = null,
            ctx = null,
            node = null,
            analyser = null,
            destination = null,
            streamSelGain = null,
            carrierDetune = null,
            сarrierGain = null,
            ringCarrier = null,
            ringGain = null,
            filter_20Sel = null,
            filter_20 = null,
            filter_50Sel = null,
            filter_50 = null,
            filter_75Sel = null,
            filter_75 = null,
            filter_560Sel = null,
            filter_560 = null,
            filter_2000Sel = null,
            filter_2000 = null,
            filter_5000Sel = null,
            filter_5000 = null,
            streamGain = null;

        this.init = function () {
            var audioContext = w.audioContext || w.webkitAudioContext;
            navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
            try {
                this.createCanvas(d.querySelector("#target"));
                context = new audioContext();
                destination = context.destination;
                node = context.createScriptProcessor(2048, 1, 1);
                //navigator.getMedia({ audio: true }, trap.getStriam, trap.catchError);
                this.fromBuffer();
                this.addEvents();
            } catch (e) {
                throw (e.message);
            }
        };
        this.addEvents = function () {
            streamSelGain = d.querySelector('#voice-gain');
            carrierDetune = d.querySelector('#сarrier-detune');
            сarrierGain = d.querySelector('#сarrier-gain');
            filter_20Sel = d.querySelector('#filter_20');
            filter_50Sel = d.querySelector('#filter_50');
            filter_75Sel = d.querySelector('#filter_75');
            filter_560Sel = d.querySelector('#filter_560');
            filter_2000Sel = d.querySelector('#filter_2000');
            filter_5000Sel = d.querySelector('#filter_5000');

            streamSelGain.addEventListener('change', function () {
                streamGain.gain.value = this.value;
            }, false);

            carrierDetune.addEventListener('change', function () {
                ringCarrier.detune.value = this.value;
            }, false);

            сarrierGain.addEventListener('change', function () {
                ringGain.gain.setValueAtTime(this.value, 0);
            }, false);

            filter_20Sel.addEventListener('change', function () {
                filter_20.gain.value = this.value;
                filter_20Sel.parentNode.querySelector('b').innerHTML = this.value;
            }, false);

            filter_50Sel.addEventListener('change', function () {
                filter_50.gain.value = this.value;
                filter_50Sel.parentNode.querySelector('b').innerHTML = this.value;
            }, false);

            filter_75Sel.addEventListener('change', function () {
                filter_75.gain.value = this.value;
                filter_75Sel.parentNode.querySelector('b').innerHTML = this.value;
            }, false);

            filter_560Sel.addEventListener('change', function () {
                filter_560.gain.value = this.value;
                filter_560Sel.parentNode.querySelector('b').innerHTML = this.value;
            }, false);

            filter_2000Sel.addEventListener('change', function () {
                filter_2000.gain.value = this.value;
                filter_2000Sel.parentNode.querySelector('b').innerHTML = this.value;
            }, false);

            filter_5000Sel.addEventListener('change', function () {
                filter_5000.gain.value = this.value;
                filter_5000Sel.parentNode.querySelector('b').innerHTML = this.value;
            }, false);
        }

        this.fromBuffer = function () {
            var voice = context.createBufferSource();
            trap.createAnalyser();
            trap.strimProcessing(voice);
        };
        /*
        * перехватывает сигнал с микрофона
        */
        this.getStriam = function (striam) {
            var source = context.createMediaStreamSource(striam);
            console.log(source);
            //trap.createAnalyser();
            trap.strimProcessing(source);
        };
        /*
        * Вывод ошибок
        */
        this.catchError = function (err) {
            throw (err);
        }
        /*
        * Создание конвы и вставка её на страницу
        * @param {Object} el - куда вставлять канву
        */
        this.createCanvas = function (el) {
            el = el || d.body;
            canva = d.createElement("canvas");
            ctx = canva.getContext("2d");
            canva.width = 1000;
            canva.height = 250;
            el.appendChild(canva);
        };
        /*
        * Создает анализатор для входного сигнала
        */
        this.createAnalyser = function () {
            analyser = context.createAnalyser();
            analyser.smoothingTimeConstant = 0.3;
            analyser.fftSize = 512;
        };
        /*
        * Отрисовка входного сигнала на канве
        * @param {Array} array - частотная характеристика сигнала
        */
        this.draw = function (array) {
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

        this.strimProcessing = function (source) {
            var loader = new BufferLoader(context, [
                    "effects/breath.ogg",
                    "effects/telephone.wav",
                    "effects/gettysburg.ogg",
                    "effects/reverb.wav",
                    "effects/test.ogg"
                ], function (buffers) {
                    source.buffer = buffers[2];
                    source.loop = false;
                    //Фоновый звук
                    //new bgSound(buffers);
                    analyser.connect(node);
                    //Усилитель
                    streamGain = context.createGain();
                    streamGain.gain.value = streamSelGain.value;
                    //Свертка
                    var convolver = context.createConvolver();
                    convolver.buffer = buffers[3];

                    var convoGain = context.createGain();
                    convoGain.gain.value = 1;
                    convolver.connect(convoGain);
                    //компрессор
                    var compressor = context.createDynamicsCompressor();
                    compressor.threshold.value = -48.2;
                    compressor.ratio.value = 5;
                    
                    //анализатор
                    source.connect(streamGain);
                    streamGain.connect(analyser);

                    streamGain.connect(convoGain);
                    convoGain.connect(trap.ringModul());
                    ringGain.connect(compressor);
                    var out = trap.setFilters(compressor);

                    out.connect(destination);
                    node.connect(destination);
                    //ringCarrier.noteOn(0);
                    //source.start(0);
                    //тут отлавливаем данные для построения графика
                    node.onaudioprocess = function () {
                        var array = new Uint8Array(analyser.frequencyBinCount);
                        analyser.getByteFrequencyData(array);
                        trap.draw(array);
                    };
                });
            loader.load();
        }

        this.setFilters = function (source) {
            var filterGain = context.createGain();

            filter_20 = context.createBiquadFilter();
            filter_20.type = filter_20.HIGHSHELF;    
            filter_20.gain.value = filter_20Sel.value;    
            filter_20.Q.value = 1;
            filter_20.frequency.value = 20;

            filter_50 = context.createBiquadFilter();
            filter_50.type = filter_50.HIGHSHELF;    
            filter_50.gain.value = filter_50Sel.value;    
            filter_50.Q.value = 1;
            filter_50.frequency.value = 50;

            filter_75 = context.createBiquadFilter();
            filter_75.type = filter_75.HIGHSHELF;    
            filter_75.gain.value = filter_75Sel.value;    
            filter_75.Q.value = 1;
            filter_75.frequency.value = 75;

            filter_560= context.createBiquadFilter();
            filter_560.type = filter_560.HIGHSHELF;    
            filter_560.gain.value = filter_560Sel.value;    
            filter_560.Q.value = 1;
            filter_560.frequency.value = 560;

            filter_2000 = context.createBiquadFilter();
            filter_2000.type = filter_2000.HIGHSHELF;    
            filter_2000.gain.value = filter_2000Sel.value;    
            filter_2000.Q.value = 1;
            filter_2000.frequency.value = 2000;

            filter_5000 = context.createBiquadFilter();
            filter_5000.type = filter_5000.HIGHSHELF;    
            filter_5000.gain.value = filter_5000Sel.value;    
            filter_5000.Q.value = 1;
            filter_5000.frequency.value = 8000;

            //нелинейное искажение
            var ngFollower = context.createBiquadFilter();
            ngFollower.type = ngFollower.LOWPASS;
            ngFollower.frequency.value = 1000;

            //var ngHigpass = context.createBiquadFilter();
            //ngHigpass.type = ngHigpass.HIGHPASS;
            //ngHigpass.frequency.value = 50;

            source.connect(filter_20);
            filter_20.connect(filter_50);
            filter_50.connect(filter_75);
            filter_75.connect(filter_560);
            filter_560.connect(filter_2000);
            filter_2000.connect(filter_5000);
            filter_5000.connect(ngFollower);
            //ngFollower.connect(ngHigpass);

            return ngFollower;
        };

        this.ringModul = function () {
            //Кольцевая модуляция
            ringGain = context.createGain();
            ringGain.gain.setValueAtTime(сarrierGain.value, 0);
            //Несущий сигнал
            ringCarrier = context.createOscillator();
            ringCarrier.type = ringCarrier.SINE;
            ringCarrier.frequency.setValueAtTime(40, 0);
            ringCarrier.detune.value = carrierDetune.value;

             var ngHigpass = context.createBiquadFilter();
            ngHigpass.type = ngHigpass.HIGHPASS;
            ngHigpass.frequency.value = 75;

            ringCarrier.connect(ngHigpass);

            ngHigpass.connect(ringGain.gain);
            ringCarrier.noteOn(0);
            return ringGain;
        };
        /*
        * Добавляет фоновый звук
        * @param {Array} buffers - буффер
        */
        var bgSound = function (buffers) {
            var bg = this;
            this.gainSel = d.querySelector('#bg-gain');
            this.isPlaying = false;
            this.buffers = buffers;

            this.play();

            setInterval(function () {
                bg.isPlaying ? bg.stop() : bg.play();
                bg.isPlaying = !bg.isPlaying;
            }, 3000);

            //Изменение уровня сигнала
            this.gainSel.addEventListener('change', function () {
                bg.gainNode.gain.value = this.value;
            }, false);
        };

        bgSound.prototype.play = function () {
            this.bg = context.createBufferSource();
            this.bg.buffer = this.buffers[0];
            //console.log(this.bg);
            //Усилитель
            this.gainNode = context.createGain();
            this.gainNode.gain.value = this.gainSel.value || 0.1;

            this.bg.connect(this.gainNode);
            this.gainNode.connect(destination);

            this.bg.start(0);
            this.isPlaying = true;
        };

        bgSound.prototype.stop = function () {
            this.bg.stop(0);
        };
    };
    //Загрузка 
    var BufferLoader = function (context, urlList, callback) {
        this.context = context;
        this.urlList = urlList;
        this.onload = callback;
        this.bufferList = new Array();
        this.loadCount = 0;
    };

    BufferLoader.prototype.load = function () {
        for (var i = 0; i < this.urlList.length; ++i) {
            this.loadBuffer(this.urlList[i], i);
        }
    };

    BufferLoader.prototype.loadBuffer = function (url, index) {
        var request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "arraybuffer";

        var loader = this;

        request.onload = function () {
            loader.context.decodeAudioData(
                request.response,
                function (buffer) {
                    if (!buffer) {
                        alert('error decoding file data: ' + url);
                        return;
                    }
                    loader.bufferList[index] = buffer;
                    if (++loader.loadCount == loader.urlList.length) {
                        loader.onload(loader.bufferList);
                    }
                },
                function (error) {
                    console.error('decodeAudioData error', error);
                }
            );
        }

        request.onerror = function () {
            alert('BufferLoader: XHR error');
        }

        request.send();
    };

    var trap = new AudioTrap();
    //погнали
    trap.init();
};