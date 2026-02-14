var InfoPanel = {
    version: "1.0",
    githubLink: "https://github.com/xkrsakj",

    elements: {
        version: null,
        githubLink: null,
        okBtn: null
    },

    init: function() {
        this.cacheElements();
        this.bindEvents();
        this.render();
    },

    cacheElements: function() {
        this.elements.version = document.getElementById("version");
        this.elements.githubLink = document.getElementById("github-link");
        this.elements.okBtn = document.getElementById("ok-btn");
    },

    bindEvents: function() {
        this.elements.okBtn.addEventListener("click", this.onOkClick.bind(this));
        this.elements.githubLink.addEventListener("click", this.onGithubClick.bind(this));
    },

    render: function() {
        this.elements.version.textContent = this.version;
    },

    onOkClick: function(event) {
        window.electronAPI.infoOk();
    },

    onGithubClick: function(event) {
        window.electronAPI.infoOpenGithub(this.githubLink);
    }
};

document.addEventListener("DOMContentLoaded", function() {
    InfoPanel.init();
});
