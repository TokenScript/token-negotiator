var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { OutletAction, OutletResponseAction } from "./messaging";
import { Messaging } from "../core/messaging";
import { Ui } from "./ui";
import { asyncHandle, logger, requiredParams } from "../utils";
import { getNftCollection, getNftTokens } from "../utils/token/nftProvider";
import "./../vendor/keyShape";
import { Authenticator } from "@tokenscript/attestation";
import { TokenStore } from "./tokenStore";
import { SignedUNChallenge } from "./auth/signedUNChallenge";
import { TicketZKProof } from "./auth/ticketZKProof";
import { isUserAgentSupported, unSupportedUserAgents } from './../utils/support/isSupported';
import { getBrowserData } from "../utils/support/getBrowserData";
if (typeof window !== "undefined")
    window.tn = { version: "2.0.0" };
var defaultConfig = {
    type: "active",
    issuers: [],
    uiOptions: {
        uiType: "popup",
        containerElement: ".overlay-tn",
        openingHeading: "Validate your token ownership for access",
        issuerHeading: "Detected tokens",
        autoPopup: true
    },
    autoLoadTokens: true,
    autoEnableTokens: true,
    messagingForceTab: false
};
var Client = (function () {
    function Client(config) {
        var _this = this;
        var _a;
        this.clientCallBackEvents = {};
        this.uiUpdateCallbacks = {};
        this.cancelAutoload = true;
        this.eventSender = {
            emitAllTokensToClient: function (tokens) {
                _this.on("tokens", null, tokens);
            },
            emitSelectedTokensToClient: function (tokens) {
                _this.on("tokens-selected", null, { selectedTokens: tokens });
            },
            emitProofToClient: function (data, issuer, error) {
                if (error === void 0) { error = ""; }
                _this.on("token-proof", null, { data: data, issuer: issuer, error: error });
            },
        };
        config.uiOptions = __assign(__assign({}, defaultConfig.uiOptions), config === null || config === void 0 ? void 0 : config.uiOptions);
        this.config = Object.assign(defaultConfig, config);
        this.negotiateAlreadyFired = false;
        this.tokenStore = new TokenStore(this.config.autoEnableTokens);
        if (((_a = this.config.issuers) === null || _a === void 0 ? void 0 : _a.length) > 0)
            this.tokenStore.updateIssuers(this.config.issuers);
        this.messaging = new Messaging();
    }
    Client.getKey = function (file) {
        return Authenticator.decodePublicKey(file);
    };
    Client.prototype.getTokenStore = function () {
        return this.tokenStore;
    };
    Client.prototype.getUi = function () {
        return this.ui;
    };
    Client.prototype.triggerUiUpdateCallback = function (type, data) {
        if (this.uiUpdateCallbacks[type])
            this.uiUpdateCallbacks[type](data);
    };
    Client.prototype.registerUiUpdateCallback = function (type, callback) {
        this.uiUpdateCallbacks[type] = callback;
    };
    Client.prototype.safeConnectAvailable = function () {
        return this.config.safeConnectOptions !== undefined;
    };
    Client.prototype.getWalletProvider = function () {
        return __awaiter(this, void 0, void 0, function () {
            var Web3WalletProvider;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.web3WalletProvider) return [3, 2];
                        return [4, import("./../wallet/Web3WalletProvider")];
                    case 1:
                        Web3WalletProvider = (_a.sent()).Web3WalletProvider;
                        this.web3WalletProvider = new Web3WalletProvider(this.config.safeConnectOptions);
                        _a.label = 2;
                    case 2: return [2, this.web3WalletProvider];
                }
            });
        });
    };
    Client.prototype.negotiatorConnectToWallet = function (walletType) {
        return __awaiter(this, void 0, void 0, function () {
            var walletProvider, walletAddress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getWalletProvider()];
                    case 1:
                        walletProvider = _a.sent();
                        return [4, walletProvider.connectWith(walletType)];
                    case 2:
                        walletAddress = _a.sent();
                        logger(2, "wallet address found: " + walletAddress);
                        return [2, walletAddress];
                }
            });
        });
    };
    Client.prototype.setPassiveNegotiationWebTokens = function () {
        return __awaiter(this, void 0, void 0, function () {
            var issuers, _a, _b, _i, issuer, res, issuerConfig, err_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        issuers = this.tokenStore.getCurrentIssuers(false);
                        _a = [];
                        for (_b in issuers)
                            _a.push(_b);
                        _i = 0;
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3, 7];
                        issuer = _a[_i];
                        res = void 0;
                        issuerConfig = this.tokenStore.getCurrentIssuers()[issuer];
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 5]);
                        return [4, this.messaging.sendMessage({
                                action: OutletAction.GET_ISSUER_TOKENS,
                                origin: issuerConfig.tokenOrigin,
                                data: {
                                    issuer: issuer,
                                    filter: issuerConfig.filters
                                }
                            }, this.config.messagingForceTab)];
                    case 3:
                        res = _c.sent();
                        return [3, 5];
                    case 4:
                        err_1 = _c.sent();
                        logger(2, err_1);
                        return [3, 6];
                    case 5:
                        logger(2, "tokens:");
                        logger(2, res.data.tokens);
                        this.tokenStore.setTokens(issuer, res.data.tokens);
                        _c.label = 6;
                    case 6:
                        _i++;
                        return [3, 1];
                    case 7: return [2];
                }
            });
        });
    };
    Client.prototype.enrichTokenLookupDataOnChainTokens = function () {
        return __awaiter(this, void 0, void 0, function () {
            var issuers, _a, _b, _i, issuer, tokenData, lookupData;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this.issuersLoaded = false;
                        this.triggerUiUpdateCallback(0);
                        issuers = this.tokenStore.getCurrentIssuers(true);
                        _a = [];
                        for (_b in issuers)
                            _a.push(_b);
                        _i = 0;
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3, 4];
                        issuer = _a[_i];
                        tokenData = issuers[issuer];
                        if (tokenData.title)
                            return [3, 3];
                        return [4, getNftCollection(tokenData)];
                    case 2:
                        lookupData = _c.sent();
                        if (lookupData) {
                            lookupData.onChain = true;
                            this.tokenStore.updateTokenLookupStore(issuer, lookupData);
                        }
                        _c.label = 3;
                    case 3:
                        _i++;
                        return [3, 1];
                    case 4:
                        this.issuersLoaded = true;
                        this.triggerUiUpdateCallback(1);
                        return [2];
                }
            });
        });
    };
    Client.prototype.negotiate = function (issuers, openPopup) {
        if (openPopup === void 0) { openPopup = false; }
        return __awaiter(this, void 0, void 0, function () {
            var isBrowserSupported;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.checkBrowserSupport()];
                    case 1:
                        isBrowserSupported = _a.sent();
                        if (!isBrowserSupported) {
                            this.ui = new Ui(this.config.uiOptions, this);
                            this.ui.initialize();
                            this.ui.openOverlay();
                            setTimeout(function () {
                                _this.ui.showError("This browser is not supported. Please try using Chrome, Edge, FireFox or Safari.", false);
                                _this.ui.viewContainer.style.display = 'none';
                            }, 1000);
                            return [2];
                        }
                        if (issuers)
                            this.tokenStore.updateIssuers(issuers);
                        requiredParams(Object.keys(this.tokenStore.getCurrentIssuers()).length, "issuers are missing.");
                        if (!(this.config.type === "active")) return [3, 3];
                        this.issuersLoaded = false;
                        this.activeNegotiationStrategy(openPopup);
                        return [4, this.enrichTokenLookupDataOnChainTokens()];
                    case 2:
                        _a.sent();
                        return [3, 6];
                    case 3: return [4, this.enrichTokenLookupDataOnChainTokens()];
                    case 4:
                        _a.sent();
                        return [4, this.passiveNegotiationStrategy()];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [2];
                }
            });
        });
    };
    Client.prototype.checkBrowserSupport = function () {
        var supported = true;
        var browserData = getBrowserData();
        for (var browser in browserData) {
            if (browserData[browser] && unSupportedUserAgents.includes(browser)) {
                supported = false;
            }
        }
        return supported;
    };
    Client.prototype.activeNegotiationStrategy = function (openPopup) {
        var autoOpenPopup;
        if (this.ui) {
            autoOpenPopup = this.tokenStore.hasUnloadedTokens();
        }
        else {
            this.ui = new Ui(this.config.uiOptions, this);
            this.ui.initialize();
            autoOpenPopup = true;
        }
        if (this.config.autoEnableTokens && Object.keys(this.tokenStore.getSelectedTokens()).length)
            this.eventSender.emitSelectedTokensToClient(this.tokenStore.getSelectedTokens());
        if (openPopup || (this.config.uiOptions.autoPopup === true && autoOpenPopup))
            this.ui.openOverlay();
    };
    Client.prototype.tokenAutoLoad = function (onLoading, onComplete) {
        return __awaiter(this, void 0, void 0, function () {
            var count, _a, _b, _i, issuerKey, tokens, tokens_1, e_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (this.config.autoLoadTokens === false)
                            return [2];
                        this.cancelAutoload = false;
                        count = 1;
                        _a = [];
                        for (_b in this.tokenStore.getCurrentIssuers())
                            _a.push(_b);
                        _i = 0;
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3, 7];
                        issuerKey = _a[_i];
                        tokens = this.tokenStore.getIssuerTokens(issuerKey);
                        if ((tokens === null || tokens === void 0 ? void 0 : tokens.length) > 0)
                            return [3, 6];
                        onLoading(issuerKey);
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 5]);
                        return [4, this.connectTokenIssuer(issuerKey)];
                    case 3:
                        tokens_1 = _c.sent();
                        onComplete(issuerKey, tokens_1);
                        return [3, 5];
                    case 4:
                        e_1 = _c.sent();
                        console.log("Failed to load " + issuerKey + ": " + e_1);
                        onComplete(issuerKey, null);
                        return [3, 5];
                    case 5:
                        count++;
                        if (this.cancelAutoload || (this.config.autoLoadTokens !== true && count > this.config.autoLoadTokens))
                            return [3, 7];
                        _c.label = 6;
                    case 6:
                        _i++;
                        return [3, 1];
                    case 7: return [2];
                }
            });
        });
    };
    Client.prototype.cancelTokenAutoload = function () {
        this.cancelAutoload = true;
    };
    Client.prototype.setPassiveNegotiationOnChainTokens = function () {
        return __awaiter(this, void 0, void 0, function () {
            var issuers, walletProvider, _a, _b, _i, issuerKey, issuer, tokens;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        issuers = this.tokenStore.getCurrentIssuers(true);
                        return [4, this.getWalletProvider()];
                    case 1:
                        walletProvider = _c.sent();
                        _a = [];
                        for (_b in issuers)
                            _a.push(_b);
                        _i = 0;
                        _c.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3, 5];
                        issuerKey = _a[_i];
                        issuer = issuers[issuerKey];
                        return [4, getNftTokens(issuer, walletProvider.getConnectedWalletData()[0].address)];
                    case 3:
                        tokens = _c.sent();
                        this.tokenStore.setTokens(issuerKey, tokens);
                        _c.label = 4;
                    case 4:
                        _i++;
                        return [3, 2];
                    case 5: return [2];
                }
            });
        });
    };
    Client.prototype.passiveNegotiationStrategy = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tokens, issuer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, asyncHandle(this.setPassiveNegotiationWebTokens())];
                    case 1:
                        _a.sent();
                        return [4, asyncHandle(this.setPassiveNegotiationOnChainTokens())];
                    case 2:
                        _a.sent();
                        tokens = this.tokenStore.getCurrentTokens();
                        logger(2, "Emit tokens");
                        logger(2, tokens);
                        for (issuer in tokens) {
                            tokens[issuer] = { tokens: tokens[issuer] };
                        }
                        this.eventSender.emitAllTokensToClient(tokens);
                        if (this.messaging.iframeStorageSupport === false && Object.keys(this.tokenStore.getCurrentTokens(false)).length === 0)
                            logger(2, "iFrame storage support not detected: Enable popups via your browser to access off-chain tokens with this negotiation type.");
                        return [2];
                }
            });
        });
    };
    Client.prototype.connectTokenIssuer = function (issuer) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var config, tokens, walletProvider, walletAddress, res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        config = this.tokenStore.getCurrentIssuers()[issuer];
                        if (!config)
                            throw new Error("Undefined token issuer");
                        if (!(config.onChain === true)) return [3, 3];
                        return [4, this.getWalletProvider()];
                    case 1:
                        walletProvider = _b.sent();
                        walletAddress = (_a = walletProvider.getConnectedWalletData()[0]) === null || _a === void 0 ? void 0 : _a.address;
                        requiredParams(issuer, "issuer is required.");
                        requiredParams(walletAddress, "wallet address is missing.");
                        return [4, getNftTokens(config, walletAddress)];
                    case 2:
                        tokens = _b.sent();
                        this.tokenStore.setTokens(issuer, tokens);
                        return [3, 5];
                    case 3: return [4, this.messaging.sendMessage({
                            action: OutletAction.GET_ISSUER_TOKENS,
                            origin: config.tokenOrigin,
                            data: {
                                issuer: issuer,
                                filter: config.filters
                            },
                        }, this.config.messagingForceTab)];
                    case 4:
                        res = _b.sent();
                        tokens = res.data.tokens;
                        this.tokenStore.setTokens(issuer, res.data.tokens);
                        _b.label = 5;
                    case 5:
                        if (this.config.autoEnableTokens)
                            this.eventSender.emitSelectedTokensToClient(this.tokenStore.getSelectedTokens());
                        return [2, tokens];
                }
            });
        });
    };
    Client.prototype.updateSelectedTokens = function (selectedTokens) {
        this.tokenStore.setSelectedTokens(selectedTokens);
        this.eventSender.emitSelectedTokensToClient(selectedTokens);
    };
    Client.prototype.isCurrentDeviceSupported = function () {
        var _a, _b;
        return isUserAgentSupported((_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.unSupportedUserAgent) === null || _b === void 0 ? void 0 : _b.config) !== false;
    };
    Client.prototype.authenticate = function (authRequest) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function () {
            var issuer, unsignedToken, config, timer, AuthType, authenticator, res, err_2;
            var _this = this;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!this.isCurrentDeviceSupported()) {
                            if (this.ui) {
                                setTimeout(function () {
                                    var _a, _b, _c;
                                    _this.ui.showError((_c = (_b = (_a = _this.config) === null || _a === void 0 ? void 0 : _a.unSupportedUserAgent) === null || _b === void 0 ? void 0 : _b.errorMessage) !== null && _c !== void 0 ? _c : "This browser cannot yet support full token authentication. Please try using Chrome, FireFox or Safari.");
                                    _this.ui.openOverlay();
                                }, 1000);
                            }
                            throw new Error((_c = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.unSupportedUserAgent) === null || _b === void 0 ? void 0 : _b.errorMessage) !== null && _c !== void 0 ? _c : "This browser cannot yet support full token authentication. Please try using Chrome, FireFox or Safari.");
                        }
                        issuer = authRequest.issuer, unsignedToken = authRequest.unsignedToken;
                        requiredParams(issuer && unsignedToken, "Issuer and signed token required.");
                        config = this.tokenStore.getCurrentIssuers()[issuer];
                        if (!config)
                            throw new Error("Provided issuer was not found.");
                        if (this.ui) {
                            timer = setTimeout(function () {
                                _this.ui.showLoader("<h4>Authenticating...</h4>", "<small>You may need to sign a new challenge in your wallet</small>");
                                _this.ui.openOverlay();
                            }, 600);
                        }
                        if (authRequest.type) {
                            AuthType = authRequest.type;
                        }
                        else {
                            AuthType = config.onChain ? SignedUNChallenge : TicketZKProof;
                        }
                        authenticator = new AuthType();
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 3, , 4]);
                        if (!authRequest.options)
                            authRequest.options = {};
                        (_d = authRequest.options) === null || _d === void 0 ? void 0 : _d.messagingForceTab = this.config.messagingForceTab;
                        return [4, authenticator.getTokenProof(config, [authRequest.unsignedToken], this.web3WalletProvider, authRequest)];
                    case 2:
                        res = _e.sent();
                        logger(2, "Ticket proof successfully validated.");
                        this.eventSender.emitProofToClient(res.data, issuer);
                        return [3, 4];
                    case 3:
                        err_2 = _e.sent();
                        logger(2, err_2);
                        this.handleProofError(err_2, issuer);
                        throw err_2;
                    case 4:
                        if (this.ui) {
                            if (timer)
                                clearTimeout(timer);
                            this.ui.dismissLoader();
                            this.ui.closeOverlay();
                        }
                        return [2, res.data];
                }
            });
        });
    };
    Client.prototype.handleProofError = function (err, issuer) {
        var _a;
        if (this.ui)
            this.ui.showError((_a = err.message) !== null && _a !== void 0 ? _a : err);
        this.eventSender.emitProofToClient(null, issuer, err);
    };
    Client.prototype.addTokenViaMagicLink = function (magicLink) {
        return __awaiter(this, void 0, void 0, function () {
            var url, params, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = new URL(magicLink);
                        params = url.hash.length > 1 ? url.hash.substring(1) : url.search.substring(1);
                        return [4, this.messaging.sendMessage({
                                action: OutletAction.MAGIC_URL,
                                origin: url.origin + url.pathname,
                                data: {
                                    urlParams: params
                                }
                            }, this.config.messagingForceTab)];
                    case 1:
                        res = _a.sent();
                        if (res.evt === OutletResponseAction.ISSUER_TOKENS)
                            return [2, res.data.tokens];
                        throw new Error(res.errors.join("\n"));
                }
            });
        });
    };
    Client.prototype.on = function (type, callback, data) {
        requiredParams(type, "Event type is not defined");
        if (callback) {
            this.clientCallBackEvents[type] = callback;
        }
        else {
            if (this.clientCallBackEvents[type]) {
                return this.clientCallBackEvents[type].call(type, data);
            }
        }
    };
    return Client;
}());
export { Client };
//# sourceMappingURL=index.js.map