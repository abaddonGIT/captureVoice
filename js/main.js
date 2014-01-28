var d = document,
    w = window;

w.onload = function () {
    var AudioTrap = function () {
        var trap = this,
        context = null,
        canva = null,
        ctx = null,
        node = null,
        analyser = null;

        this.init = function () {
            var audioContext = w.audioContext || w.webkitAudioContext;
            navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
            //пробуем создать стрим
            try {
                //Создание и добавление канвы
                this.createCanvas(d.querySelector("#target"));
                context = new audioContext();
                node = context.createScriptProcessor(2048, 1, 1);
                //Создаем анализатор
                this.createAnalyser();
                navigator.getMedia({ audio: true }, trap.getStriam, trap.catchError);
            } catch (e) {
                throw ("Ваш браузер не поддерживает захват аудио!!!");
            }
        };

        this.getStriam = function (striam) {
            //ловим наш стрим для обработки audioContext 
            var source = context.createMediaStreamSource(striam);
            //подключаем анализатор к источнику
            source.connect(analyser);
            //подключаем анализатор к интерфейсу обработки данных
            analyser.connect(node);
            node.connect(context.destination);
            source.connect(context.destination);
            //тут отлавливаем данные для построения графика
            node.onaudioprocess = function () {
                var array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);
                trap.draw(array);
            };
        };

        this.catchError = function (err) {
            console.log(err);
        }

        this.createCanvas = function (el) {
            el = el || d.body;
            canva = d.createElement("canvas");
            ctx = canva.getContext("2d");
            canva.width = 600;
            canva.height = 400;
            el.appendChild(canva);
        };

        this.createAnalyser = function () {
            analyser = context.createAnalyser();
            analyser.smoothingTimeConstant = 0.3;
            analyser.fftSize = 512;
        };

        this.draw = function (array) {
            var ln = array.length;
            ctx.clearRect(0, 0, canva.width, canva.height);

            ctx.fillStyle = '#F6D565';
            ctx.lineCap = 'round';

            for (var i = 0; i < ln; ++i) {
                var magnitude = 0;
                var loc = array[i];
                ctx.fillStyle = "hsl( " + Math.round((i * 360) / Math.round(canva.width / 2)) + ", 100%, 50%)";
                ctx.fillRect(i*5,canva.height,3,-loc);
            }
        };
    };

    var trap = new AudioTrap();
    //погнали
    trap.init();
};