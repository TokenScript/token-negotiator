var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { AbstractView } from "./view-interface";
var TokenList = (function (_super) {
    __extends(TokenList, _super);
    function TokenList() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.loadedCount = 0;
        _this.numberToLoad = 25;
        _this.autoLoadMore = true;
        return _this;
    }
    TokenList.prototype.init = function () {
        var _this = this;
        this.viewContainer.addEventListener('click', function (e) {
            if (e.target.classList.contains('mobileToggle-tn')) {
                _this.tokenToggleSelection();
            }
            else if (e.target.classList.contains('load-more-btn-tn')) {
                _this.loadMoreTokens();
            }
        });
    };
    TokenList.prototype.render = function () {
        var _this = this;
        this.loadedCount = 0;
        this.viewContainer.innerHTML = this.getTokenListItems();
        if (this.autoLoadMore) {
            var loadMoreElem = this.viewContainer.querySelector('.load-more-tn');
            if (loadMoreElem) {
                if (!this.interceptObs)
                    this.interceptObs = new IntersectionObserver(function (payload) {
                        if (payload[0].isIntersecting) {
                            _this.loadMoreTokens();
                        }
                    }, { root: document.querySelector('.view-content-tn') });
                this.interceptObs.observe(loadMoreElem);
            }
        }
    };
    TokenList.prototype.getTokenListItems = function () {
        var html = "";
        var newCount = Math.min((this.loadedCount + this.numberToLoad), this.params.tokens.length);
        for (var i = this.loadedCount; i < newCount; i++) {
            html += this.createTokenMarkup(this.params.tokens[i]);
        }
        this.loadedCount = newCount;
        if (this.loadedCount < this.params.tokens.length)
            html += this.createLoadMoreMarkup();
        return html;
    };
    TokenList.prototype.loadMoreTokens = function () {
        var loadMoreElem = this.viewContainer.getElementsByClassName('load-more-tn')[0];
        if (this.interceptObs)
            this.interceptObs.unobserve(loadMoreElem);
        loadMoreElem.insertAdjacentHTML('afterend', this.getTokenListItems());
        loadMoreElem.remove();
        if (this.interceptObs) {
            var loadMoreElem_1 = this.viewContainer.querySelector('.load-more-tn');
            if (loadMoreElem_1)
                this.interceptObs.observe(loadMoreElem_1);
        }
    };
    TokenList.prototype.tokenToggleSelection = function () {
        var selectedTokens = this.client.getTokenData().selectedTokens;
        this.viewContainer.querySelectorAll('.mobileToggle-tn').forEach(function (token, index) {
            if (index === 0) {
                selectedTokens[token.dataset.key] = {};
                selectedTokens[token.dataset.key]['tokens'] = [];
            }
            if (token.checked === true) {
                var output = JSON.parse(token.dataset.token);
                selectedTokens[token.dataset.key].tokens.push(output);
            }
        });
        console.log("Tokens selected:");
        console.log(selectedTokens);
        this.client.updateSelectedTokens(selectedTokens);
    };
    TokenList.prototype.createLoadMoreMarkup = function () {
        return "\n            <li class='load-more-tn'>\n                <button class=\"load-more-btn-tn btn-tn\">Load More</button>\n            </li>\n        ";
    };
    TokenList.prototype.createTokenMarkup = function (config) {
        var tokenIssuerKey = config.tokenIssuerKey, title = config.title, data = config.data, index = config.index, emblem = config.emblem, toggleState = config.toggleState;
        return "\n            <li class='token-tn'>\n              <img class='emblem-tn' src=" + emblem + " />\n              <div class='data-tn'>\n                  <p class='token-title-tn'>" + title + "</p>\n                  <p class='detail-tn'>#" + index + "</p>\n                </div>\n              <div class='toggle-tn'>\n                <input " + (toggleState ? 'checked' : '') + " data-key='" + tokenIssuerKey + "' data-token='" + JSON.stringify(data) + "' data-index='" + index + "' type='checkbox' name='toggle" + index + "' class='mobileToggle-tn toggle-tn' id='toggle" + index + "'>\n                <label for='toggle" + index + "'></label>\n              </div>\n            </li>\n        ";
    };
    return TokenList;
}(AbstractView));
export { TokenList };
//# sourceMappingURL=token-list.js.map