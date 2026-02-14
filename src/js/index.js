var MainPanel = {
    strokesCompleted: 0,
    percentageCompleted: 0,
    percentageStep: 0,
    remainingTime: 0,
    prevDate: null,
    interval: null,
    isPaused: false,

    imgPaths: {
        play: "../../assets/icons/play.svg",
        playActive: "../../assets/icons/play_active.svg",
        pause: "../../assets/icons/pause.svg",
        pauseActive: "../../assets/icons/pause_active.svg"
    },

    elements: {
        playBtn: null,
        playBtnImg: null,
        pauseBtn: null,
        pauseBtnImg: null,
        stopBtn: null,
        uploadBtn: null,
        settingsBtn: null,
        infoBtn: null,
        connection: null,
        drawingStatus: null,
        strokesCompleted: null,
        strokesTotal: null,
        progressPercentage: null,
        progressBar: null,
        imgPreview: null,
        remainingTime: null
    },

    init: function() {
        this.cacheElements();
        this.bindEvents();
        this.render();
    },
    
    cacheElements: function() {
        this.elements.playBtn = document.getElementById("play-btn");
        this.elements.playBtnImg = this.elements.playBtn.getElementsByTagName("img")[0];
        this.elements.pauseBtn = document.getElementById("pause-btn");
        this.elements.pauseBtnImg = this.elements.pauseBtn.getElementsByTagName("img")[0];
        this.elements.stopBtn = document.getElementById("stop-btn");
        this.elements.uploadBtn = document.getElementById("upload-btn");
        this.elements.settingsBtn = document.getElementById("settings-btn");
        this.elements.infoBtn = document.getElementById("info-btn");
        this.elements.connection = document.getElementById("connection");
        this.elements.drawingStatus = document.getElementById("robot-state");
        this.elements.strokesCompleted = document.getElementById("completed-strokes");
        this.elements.strokesTotal = document.getElementById("total-strokes");
        this.elements.progressPercentage = document.getElementById("percent");
        this.elements.progressBar = document.getElementsByClassName("progress-fill")[0];
        this.elements.imgPreview = document.getElementById("img-area").getElementsByTagName("img")[0];
        this.elements.remainingTime = document.getElementById("remaining-time");
    },

    bindEvents: function() {
        this.elements.playBtn.addEventListener("click", this.onPlayBtnClick.bind(this));
        this.elements.pauseBtn.addEventListener("click", this.onPauseBtnClick.bind(this));
        this.elements.stopBtn.addEventListener("click", this.onStopBtnClick.bind(this));
        this.elements.uploadBtn.addEventListener("click", this.onUploadBtnClick.bind(this));
        this.elements.settingsBtn.addEventListener("click", this.onSettingsBtnClick.bind(this));
        this.elements.infoBtn.addEventListener("click", this.onInfoBtnClick.bind(this));

        window.electronAPI.onConnectionUpdate(this.onConnectionUpdate.bind(this));
        window.electronAPI.onStrokeCompleted(this.onStrokeCompleted.bind(this));
        window.electronAPI.onFinished(this.onFinished.bind(this));
        window.electronAPI.onDrawingStats(this.onDrawingStats.bind(this));
    },

    render: function() {},

    onPlayBtnClick: function(event) {
        this.play();
    },

    onPauseBtnClick: function(event) {
        this.pause();
    },

    onStopBtnClick: function(event) {
        this.stop();
    },

    onUploadBtnClick: function(event) {
        this.upload();
    },

    onSettingsBtnClick: function(event) {
        this.settings();
    },

    onInfoBtnClick: function(event) {
        this.info();
    },

    onConnectionUpdate: function(connected) {
        this.updateConnection(connected);
    },

    onStrokeCompleted: function() {
        this.completeStroke();
    },

    onFinished: function() {
        this.reset();
    },

    onDrawingStats: function(stats) {
        this.updateStats(stats);
    },

    play: function() {
        if (!this.elements.playBtn.disabled) {
            this.elements.drawingStatus.firstChild.nodeValue = "drawing... ";
            this.elements.progressPercentage.textContent = `${Math.round(this.percentageCompleted)}%`;

            this.elements.playBtnImg.setAttribute("src", this.imgPaths.playActive);
            this.elements.pauseBtnImg.setAttribute("src", this.imgPaths.pause);
            this.elements.pauseBtn.disabled = false;
            this.elements.playBtn.disabled = true;

            this.isPaused = false;
            this.prevDate = new Date();

            window.electronAPI.start();
        }
    },

    pause: function() {
        if (!this.elements.pauseBtn.disabled) {
            this.elements.drawingStatus.firstChild.nodeValue = "paused... ";
            this.elements.progressPercentage.textContent = `${Math.round(this.percentageCompleted)}%`;

            this.elements.pauseBtnImg.setAttribute("src", this.imgPaths.pauseActive);
            this.elements.playBtnImg.setAttribute("src", this.imgPaths.play);
            this.elements.pauseBtn.disabled = true;
            this.elements.playBtn.disabled = false;

            this.isPaused = true;

            window.electronAPI.pause();
        }
    },

    stop: function() {
        this.reset();
        window.electronAPI.stop();
    },

    reset: function() {
        this.strokesCompleted = 0;
        this.percentageCompleted = 0;

        this.elements.drawingStatus.firstChild.nodeValue = "idle ";
        this.elements.progressPercentage.textContent = "";

        this.elements.progressBar.style.width = "0%";
        this.elements.strokesCompleted.textContent = 0;
        this.elements.strokesTotal.textContent = 0;
        this.elements.playBtnImg.setAttribute("src", this.imgPaths.play);
        this.elements.pauseBtnImg.setAttribute("src", this.imgPaths.pause);
        this.elements.playBtn.disabled = false;
        this.elements.pauseBtn.disabled = false;
        this.elements.pauseBtn.disabled = false;
        this.elements.remainingTime.textContent = "0";
        this.isPaused = false;

        clearInterval(this.interval);
    },

    upload: function() {
        window.electronAPI.upload().then((res) => {
            if (res.data != "") {
                this.reset();

                var blob = new Blob([res.data], {type: 'image/svg+xml'});
                var url = URL.createObjectURL(blob);

                this.elements.imgPreview.setAttribute("src", url);
            }
        });
    },

    settings: function() {
        window.electronAPI.openSettings();
    },

    info: function() {
        window.electronAPI.openInfo();
    },

    updateConnection: function(connected) {
        this.elements.connection.innerHTML = `<span></span> ${connected ? "online" : "offline"}`;
        this.elements.connection.classList.remove("on", "off");
        this.elements.connection.classList.add(connected ? "on" : "off");
    },

    completeStroke: function() {
        this.strokesCompleted++;
        this.percentageCompleted += this.percentageStep;

        this.elements.strokesCompleted.textContent = this.strokesCompleted;
        this.elements.progressBar.style.width = `${this.percentageCompleted}%`;
        this.elements.progressPercentage.textContent = `${Math.round(this.percentageCompleted)}%`;
    },

    updateStats: function(stats) {
        this.elements.strokesTotal.textContent = stats.strokes;
        this.elements.remainingTime.textContent = parseInt(stats.estTime/60);

        this.percentageStep = 100/stats.strokes;
        this.remainingTime = stats.estTime;
        this.prevDate = new Date();

        this.interval = setInterval(this.updateRemainingTime.bind(this), 1000);
    },

    updateRemainingTime: function() {
        if (!this.isPaused) {
            this.remainingTime -= (new Date() - this.prevDate) / 1000;

            this.elements.remainingTime.textContent = parseInt(this.remainingTime/60);

            this.prevDate = new Date();
        }
    }
};

document.addEventListener("DOMContentLoaded", function() {
    MainPanel.init();
    MainPanel.reset();
});