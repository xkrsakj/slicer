var SettingsPanel = {
    params: new URLSearchParams(window.location.search),

    elements: {
        fields: {
            originOffsetX: {
                input: null,
                button: null
            },
            originOffsetY: {
                input: null,
                button: null
            },
            topAngle: {
                input: null,
                button: null
            },
            bottomAngle: {
                input: null,
                button: null
            },
            acceleration: {
                input: null,
                button: null
            },
        },
        cancelBtn: null,
        okBtn: null
    },

    init: function() {
        this.cacheElements();
        this.bindEvents();
        this.render();
    },

    cacheElements: function() {
        this.elements.fields.originOffsetX.input = document.querySelector("#origin-x-field input");
        this.elements.fields.originOffsetX.button = document.querySelector("#origin-x-field button");
        this.elements.fields.originOffsetY.input = document.querySelector("#origin-y-field input");
        this.elements.fields.originOffsetY.button = document.querySelector("#origin-y-field button");
        this.elements.fields.topAngle.input = document.querySelector("#top-angle-field input");
        this.elements.fields.topAngle.button = document.querySelector("#top-angle-field button");
        this.elements.fields.bottomAngle.input = document.querySelector("#bottom-angle-field input");
        this.elements.fields.bottomAngle.button = document.querySelector("#bottom-angle-field button");
        this.elements.fields.acceleration.input = document.querySelector("#acceleration-field input");
        this.elements.fields.acceleration.button = document.querySelector("#acceleration-field button");
        this.elements.cancelBtn = document.getElementById("cancel-btn");
        this.elements.okBtn = document.getElementById("ok-btn");
    },

    bindEvents: function() {
        this.elements.okBtn.addEventListener("click", this.onOkClick.bind(this));
        this.elements.cancelBtn.addEventListener("click", this.onCancelClick.bind(this));
        this.elements.fields.topAngle.button.addEventListener("click", this.onTopAngleTestClick.bind(this));
        this.elements.fields.bottomAngle.button.addEventListener("click", this.onBottomAngleTestClick.bind(this));
    },

    render: function() {
        this.elements.fields.originOffsetX.input.value = this.params.get('originOffsetX');        
        this.elements.fields.originOffsetY.input.value = this.params.get('originOffsetY');
        this.elements.fields.topAngle.input.value = this.params.get('topAngle');
        this.elements.fields.bottomAngle.input.value = this.params.get('bottomAngle');
        this.elements.fields.acceleration.input.value = this.params.get('acceleration');
    },

    getSettings: function() {
        return {
            topAngle: parseInt(this.elements.fields.topAngle.input.value),
            bottomAngle: parseInt(this.elements.fields.bottomAngle.input.value),
            originOffsetX: parseInt(this.elements.fields.originOffsetX.input.value),
            originOffsetY: parseInt(this.elements.fields.originOffsetY.input.value),
            acceleration: parseInt(this.elements.fields.acceleration.input.value)
        };
    },

    testAngle: function(angle) {
        window.electronAPI.settingsServoTest(angle);
    },

    onCancelClick: function(event) {
        window.electronAPI.settingsCancel();
    },

    onOkClick: function(event) {
        var settings = this.getSettings();

        window.electronAPI.settingsOk(settings);
    },

    onTopAngleTestClick: function(event) {
        this.testAngle(this.getSettings().topAngle);
    },

    onBottomAngleTestClick: function(event) {
        this.testAngle(this.getSettings().bottomAngle);
    }
};

document.addEventListener("DOMContentLoaded", function() {
    SettingsPanel.init();
});