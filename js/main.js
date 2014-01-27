var d = document,
    w = window;

w.onload = function () {
    var AudioTrap = function () {
        var trap = this;
        this.context = null;

        this.init = function () {
            var audioContext = w.audioContext || w.webkitAudioContext;
            navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
            //пробуем создать стрим
            try {
                this.context = new audioContext();
                navigator.getMedia({audio:true}, trap.getStriam, trap.catchError);
            } catch (e) {
                throw ("Ваш браузер не поддерживает захват аудио!!!");
            }
        };

        this.getStriam = function (striam) {
            
        };

        this.catchError = function (err) {
            console.log(err);
        }
    };

    var trap = new AudioTrap();
    //погнали
    trap.init();
};