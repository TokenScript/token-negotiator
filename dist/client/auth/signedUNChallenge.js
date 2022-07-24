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
import { AbstractAuthentication } from "./abstractAuthentication";
import { SafeConnectProvider } from "../../wallet/SafeConnectProvider";
import { UN } from "./util/UN";
var SignedUNChallenge = (function (_super) {
    __extends(SignedUNChallenge, _super);
    function SignedUNChallenge() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.TYPE = "signedUN";
        return _this;
    }
    SignedUNChallenge.prototype.getTokenProof = function (_issuerConfig, _tokens, web3WalletProvider, request) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var address, currentProof, unChallenge, walletConnection, endpoint, challenge, signature, recoveredAddr;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!(web3WalletProvider.getConnectedWalletData().length === 0)) return [3, 2];
                        return [4, web3WalletProvider.connectWith("MetaMask")];
                    case 1:
                        _c.sent();
                        _c.label = 2;
                    case 2:
                        address = web3WalletProvider.getConnectedWalletData()[0].address;
                        currentProof = this.getSavedProof(address);
                        if (currentProof) {
                            unChallenge = currentProof === null || currentProof === void 0 ? void 0 : currentProof.data;
                            if (unChallenge.expiration < Date.now() ||
                                UN.recoverAddress(unChallenge) !== address.toLowerCase()) {
                                this.deleteProof(address);
                                currentProof = null;
                            }
                        }
                        if (!!currentProof) return [3, 8];
                        walletConnection = web3WalletProvider.getConnectedWalletData()[0].provider;
                        currentProof = {
                            type: this.TYPE,
                            data: {},
                            target: {
                                address: address
                            }
                        };
                        endpoint = (_b = (_a = request.options) === null || _a === void 0 ? void 0 : _a.unEndpoint) !== null && _b !== void 0 ? _b : SignedUNChallenge.DEFAULT_ENDPOINT;
                        return [4, UN.getNewUN(endpoint)];
                    case 3:
                        challenge = _c.sent();
                        signature = void 0;
                        if (!(walletConnection instanceof SafeConnectProvider)) return [3, 5];
                        return [4, walletConnection.signUNChallenge(challenge)];
                    case 4:
                        signature = _c.sent();
                        return [3, 7];
                    case 5: return [4, web3WalletProvider.signWith(challenge.messageToSign, walletConnection)];
                    case 6:
                        signature = _c.sent();
                        _c.label = 7;
                    case 7:
                        challenge.signature = signature;
                        recoveredAddr = UN.recoverAddress(challenge);
                        if (recoveredAddr !== address.toLowerCase()) {
                            throw new Error("Address signature is invalid");
                        }
                        challenge.address = recoveredAddr;
                        currentProof.data = challenge;
                        this.saveProof(address, currentProof);
                        _c.label = 8;
                    case 8: return [2, currentProof];
                }
            });
        });
    };
    SignedUNChallenge.DEFAULT_ENDPOINT = "https://crypto-verify.herokuapp.com/use-devcon-ticket";
    return SignedUNChallenge;
}(AbstractAuthentication));
export { SignedUNChallenge };
//# sourceMappingURL=signedUNChallenge.js.map