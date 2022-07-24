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
import { Messaging } from "../core/messaging";
import { uint8tohex } from "@tokenscript/attestation/dist/libs/utils";
import { KeyStore } from "@tokenscript/attestation/dist/safe-connect/KeyStore";
import { AttestedAddress } from "../client/auth/attestedAddress";
import { SafeConnectChallenge } from "../client/auth/safeConnectChallenge";
export var SafeConnectAction;
(function (SafeConnectAction) {
    SafeConnectAction["CONNECT"] = "connect";
    SafeConnectAction["NEW_CHALLENGE"] = "new_challenge";
})(SafeConnectAction || (SafeConnectAction = {}));
var SafeConnectProvider = (function () {
    function SafeConnectProvider(options) {
        this.messaging = new Messaging();
        this.keyStore = new KeyStore();
        this.options = options;
    }
    SafeConnectProvider.prototype.initSafeConnect = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var res, _b, _c, attest;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _c = (_b = this.messaging).sendMessage;
                        _d = {
                            action: SafeConnectAction.CONNECT,
                            origin: this.options.url,
                            timeout: 0
                        };
                        return [4, this.getInitialProofRequest()];
                    case 1: return [4, _c.apply(_b, [(_d.data = (_e.sent()),
                                _d), true])];
                    case 2:
                        res = _e.sent();
                        if (!this.options.initialProof)
                            return [2, res.data.address];
                        attest = res.data;
                        this.processProofResult(attest);
                        return [2, (_a = attest.data) === null || _a === void 0 ? void 0 : _a.address];
                }
            });
        });
    };
    SafeConnectProvider.prototype.processProofResult = function (attest) {
        var proofModel;
        var proofData;
        switch (this.options.initialProof) {
            case "address_attest":
                proofModel = new AttestedAddress();
                proofData = {
                    type: proofModel.TYPE,
                    data: {
                        attestation: attest.data.attestation,
                        address: attest.data.address
                    },
                    target: {
                        address: attest.data.address
                    }
                };
                proofModel.saveProof(attest.data.address, proofData);
                break;
            case "simple_challenge":
                proofModel = new SafeConnectChallenge();
                proofData = {
                    type: proofModel.TYPE,
                    data: attest.data,
                    target: {
                        address: attest.data.address
                    }
                };
                break;
        }
        proofModel.saveProof(attest.data.address, proofData);
    };
    SafeConnectProvider.prototype.getInitialProofRequest = function () {
        return __awaiter(this, void 0, void 0, function () {
            var request, holdingKey;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {};
                        if (!this.options.initialProof)
                            return [2];
                        request.type = this.options.initialProof;
                        if (!(this.options.initialProof !== "simple_challenge")) return [3, 2];
                        return [4, this.keyStore.getOrCreateKey(SafeConnectProvider.HOLDING_KEY_ALGORITHM)];
                    case 1:
                        holdingKey = _a.sent();
                        request.subject = uint8tohex(holdingKey.holdingPubKey);
                        _a.label = 2;
                    case 2: return [2, request];
                }
            });
        });
    };
    SafeConnectProvider.prototype.signUNChallenge = function (un) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.messaging.sendMessage({
                            action: SafeConnectAction.CONNECT,
                            origin: this.options.url,
                            timeout: 0,
                            data: {
                                type: "signed_un",
                                un: encodeURIComponent(JSON.stringify(un))
                            }
                        }, true)];
                    case 1:
                        res = _a.sent();
                        return [2, res.data.data.signature];
                }
            });
        });
    };
    SafeConnectProvider.prototype.getLinkSigningKey = function () {
        return __awaiter(this, void 0, void 0, function () {
            var keys;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.keyStore.getOrCreateKey(SafeConnectProvider.HOLDING_KEY_ALGORITHM)];
                    case 1:
                        keys = _a.sent();
                        return [2, keys.attestHoldingKey.privateKey];
                }
            });
        });
    };
    SafeConnectProvider.HOLDING_KEY_ALGORITHM = "RSASSA-PKCS1-v1_5";
    return SafeConnectProvider;
}());
export { SafeConnectProvider };
//# sourceMappingURL=SafeConnectProvider.js.map