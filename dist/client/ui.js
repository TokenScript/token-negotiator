import { Start } from './views/start';
import { logger, requiredParams } from "../utils";
var Ui = (function () {
    function Ui(options, client) {
        this.options = options;
        this.client = client;
    }
    Ui.prototype.initialize = function () {
        var _this = this;
        setTimeout(function () {
            _this.popupContainer = document.querySelector(_this.options.containerElement);
            requiredParams(_this.popupContainer, 'No entry point element with the class name of ' + _this.options.containerElement + ' found.');
            if (_this.popupContainer) {
                _this.initializeUIType();
                _this.addTheme();
                _this.viewContainer = _this.popupContainer.querySelector(".view-content-tn");
                _this.loadContainer = _this.popupContainer.querySelector(".load-container-tn");
                _this.retryButton = _this.loadContainer.querySelector('.dismiss-error-tn');
                _this.retryButton.addEventListener('click', function () {
                    _this.dismissLoader();
                    if (_this.retryCallback) {
                        _this.retryCallback();
                        _this.retryCallback = undefined;
                        _this.retryButton.innerText = "Dismiss";
                    }
                });
                _this.updateUI(Start);
            }
        }, 0);
    };
    Ui.prototype.initializeUIType = function () {
        var _this = this;
        this.popupContainer.classList.add(this.options.uiType + "-tn");
        switch (this.options.uiType) {
            case "popup":
                this.popupContainer.innerHTML = Ui.UI_CONTAINER_HTML + Ui.FAB_BUTTON_HTML;
                this.popupContainer.querySelector('.overlay-fab-button-tn').addEventListener('click', this.togglePopup.bind(this));
                this.popupContainer.addEventListener('click', function (event) {
                    event.stopPropagation();
                });
                document.addEventListener('click', function () {
                    _this.closeOverlay();
                });
                this.assignFabButtonAnimation();
                break;
            case "inline":
                this.popupContainer.innerHTML = Ui.UI_CONTAINER_HTML;
                break;
        }
    };
    Ui.prototype.closeOverlay = function () {
        if (this.options.uiType === "inline")
            return;
        this.popupContainer.classList.remove("open");
        window.KeyshapeJS.timelines()[0].time(0);
        window.KeyshapeJS.globalPause();
    };
    Ui.prototype.openOverlay = function () {
        var _this = this;
        if (this.options.uiType === "inline")
            return;
        setTimeout(function () {
            _this.popupContainer.classList.add("open");
            window.KeyshapeJS.timelines()[0].time(0);
            window.KeyshapeJS.globalPlay();
        }, 10);
    };
    Ui.prototype.togglePopup = function () {
        requiredParams(this.popupContainer, 'No overlay element found.');
        var openOverlay = !this.popupContainer.classList.contains("open");
        if (openOverlay) {
            this.openOverlay();
        }
        else {
            this.closeOverlay();
        }
    };
    Ui.prototype.updateUI = function (ViewClass, data) {
        if (!this.viewContainer) {
            logger(3, "Element .overlay-content-tn not found: popup not initialized");
            return;
        }
        this.currentView = new ViewClass(this.client, this, this.viewContainer, { options: this.options, data: data });
        this.currentView.render();
    };
    Ui.prototype.showError = function (message, canDismiss) {
        if (canDismiss === void 0) { canDismiss = true; }
        this.loadContainer.querySelector('.loader-tn').style.display = 'none';
        this.retryButton.style.display = 'block';
        this.loadContainer.querySelector('.loader-msg-tn').innerHTML = message;
        this.loadContainer.style.display = 'flex';
        if (!canDismiss) {
            this.loadContainer.querySelector('.dismiss-error-tn').style.display = 'none';
        }
    };
    Ui.prototype.setErrorRetryCallback = function (retryCallback) {
        this.retryCallback = retryCallback;
        this.retryButton.innerText = "Retry";
    };
    Ui.prototype.showLoader = function () {
        var message = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            message[_i] = arguments[_i];
        }
        this.loadContainer.querySelector('.loader-tn').style.display = 'block';
        this.loadContainer.querySelector('.dismiss-error-tn').style.display = 'none';
        this.loadContainer.querySelector('.loader-msg-tn').innerHTML = message.join("\n");
        this.loadContainer.style.display = 'flex';
    };
    Ui.prototype.dismissLoader = function () {
        this.loadContainer.style.display = 'none';
    };
    Ui.prototype.addTheme = function () {
        var _a, _b;
        var refTokenSelector = document.querySelector(".overlay-tn");
        if (refTokenSelector)
            refTokenSelector.classList.add(((_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.theme) !== null && _b !== void 0 ? _b : 'light') + "-tn");
    };
    Ui.prototype.assignFabButtonAnimation = function () {
        if (window.KeyshapeJS) {
            window.KeyshapeJS.globalPause();
            window.KeyshapeJS.animate("#svg-tn-left", [{ p: 'mpath', t: [0, 400], v: ['0%', '100%'], e: [[1, 0, 0, .6, 1], [0]], mp: "M13,28.5L27.1,28.1" }, { p: 'rotate', t: [0, 400], v: [0, 0], e: [[1, 0, 0, .6, 1], [0]] }, { p: 'scaleX', t: [0, 400], v: [1, 1], e: [[1, 0, 0, .6, 1], [0]] }, { p: 'scaleY', t: [0, 400], v: [1, 1], e: [[1, 0, 0, .6, 1], [0]] }, { p: 'anchorX', t: [0, 400], v: [-13, -17.1], e: [[1, 0, 0, .6, 1], [0]] }, { p: 'anchorY', t: [0, 400], v: [-13.5, -17.1], e: [[1, 0, 0, .6, 1], [0]] }, { p: 'd', t: [0, 400], v: ["path('M25.5,26C25.5,26,20.5,26,20.5,26C20.5,23.1,19.9,20.4,18.8,17.9C17.8,15.6,16.4,13.6,14.6,11.8C12.7,9.9,10.3,8.4,7.8,7.4C5.5,6.5,3,6,.5,6L.5,1C.5,1,.5,1,.5,1C.5,1,7.5,1,7.5,1L25.5,1L25.5,7.2C25.5,7.2,25.5,12.8,25.5,12.8C25.5,12.8,25.5,19,25.5,19Z')", "path('M31.8,32.8C31.5,33.2,30.9,33.4,30.4,33.4C29.9,33.4,29.4,33.2,29,32.8C29,32.8,1.4,5.2,1.4,5.2C1,4.8,.8,4.3,.8,3.8C.8,3.3,1,2.8,1.4,2.4L2.4,1.4C2.7,1,3.3,.8,3.8,.8C4.3,.8,4.8,1,5.2,1.4L5.2,1.4L32.8,29C33.2,29.4,33.4,29.9,33.4,30.4C33.4,30.9,33.2,31.5,32.8,31.8Z')"], e: [[1, 0, 0, .6, 1], [0]] }], "#svg-tn-right", [{ p: 'mpath', t: [0, 400], v: ['0%', '100%'], e: [[1, 0, 0, .6, 1], [0]], mp: "M41.5,28.7L27.1,28.1" }, { p: 'rotate', t: [0, 400], v: [0, 0], e: [[1, 0, 0, .6, 1], [0]] }, { p: 'anchorX', t: [0, 400], v: [-40.5, -17.1], e: [[1, 0, 0, .6, 1], [0]] }, { p: 'anchorY', t: [0, 400], v: [-13.5, -17.1], e: [[1, 0, 0, .6, 1], [0]] }, { p: 'd', t: [0, 400], v: ["path('M53,1C53,1,53,1,53,1C53,1,53,12.9,53,12.9L53,19C53,19,53,26,53,26C53,26,40.2,26,40.2,26L34.1,26C34.1,26,28,26,28,26C28,26,28,12.6,28,12.6L28,7.4C28,7.4,28,1,28,1C28,1,40.6,1,40.6,1C40.6,1,45.9,1,45.9,1Z')", "path('M29,1.4C29.4,1,29.9,.8,30.4,.8C30.9,.8,31.5,1,31.8,1.4L32.8,2.4C33.2,2.7,33.4,3.3,33.4,3.8C33.4,4.3,33.2,4.8,32.8,5.2L5.2,32.8C4.8,33.2,4.3,33.4,3.8,33.4C3.3,33.4,2.8,33.2,2.4,32.8L1.4,31.8C1,31.5,.8,30.9,.8,30.4C.8,29.9,1,29.4,1.4,29C1.4,29,29,1.4,29,1.4Z')"], e: [[1, 0, 0, .6, 1], [0]] }], { autoremove: false }).range(0, 400);
        }
    };
    Ui.UI_CONTAINER_HTML = "\n\t\t<div class=\"overlay-content-tn\">\n\t\t\t<div class=\"load-container-tn\" style=\"display: none;\">\n\t\t\t\t<div class=\"lds-ellipsis loader-tn\"><div></div><div></div><div></div><div></div></div>\n\t\t\t\t<div class=\"loader-msg-tn\"></div>\n\t\t\t\t<button class=\"dismiss-error-tn btn-tn\">Dismiss</button>\n\t\t\t</div>\n\t\t\t<div class=\"view-content-tn\"></div>\n\t\t</div>\n\t";
    Ui.FAB_BUTTON_HTML = "\n\t\t<button aria-label=\"token negotiator toggle\" class=\"overlay-fab-button-tn\">\n\t\t  <svg style=\"pointer-events: none\" xmlns=\"http://www.w3.org/2000/svg\" width=\"55\" height=\"55\" viewBox=\"0 0 55 55\"><path fill=\"white\" id=\"svg-tn-left\" d=\"M25.5 26h-5c0-2.9-0.6-5.6-1.7-8.1c-1-2.3-2.4-4.3-4.2-6.1c-1.9-1.9-4.3-3.4-6.8-4.4c-2.3-0.9-4.8-1.4-7.3-1.4v-5h7h18v6.2v5.6v6.2Z\" transform=\"translate(13,28.5) translate(0,0) translate(-13,-13.5)\"/><path id=\"svg-tn-right\" fill=\"white\" d=\"M53 1v11.9v6.1v7h-12.8h-6.1h-6.1v-13.4v-5.2v-6.4h12.6h5.3Z\" transform=\"translate(41.5,28.7) translate(0,0) translate(-40.5,-13.5)\"/></svg>\n\t\t</button>\n\t";
    return Ui;
}());
export { Ui };
//# sourceMappingURL=ui.js.map