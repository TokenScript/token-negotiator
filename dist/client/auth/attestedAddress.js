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
import { EthereumKeyLinkingAttestation } from "@tokenscript/attestation/dist/safe-connect/EthereumKeyLinkingAttestation";
var AttestedAddress = (function (_super) {
    __extends(AttestedAddress, _super);
    function AttestedAddress() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.TYPE = "attestedAddress";
        return _this;
    }
    AttestedAddress.prototype.getTokenProof = function (issuerConfig, _tokens, web3WalletProvider, request) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var address, currentProof, safeConnect, addrAttest, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        if (!web3WalletProvider.safeConnectAvailable())
                            throw new Error("Safe connect is not available");
                        if (!issuerConfig.onChain)
                            throw new Error(this.TYPE + " is not available for off-chain tokens.");
                        if (!((_a = request.options) === null || _a === void 0 ? void 0 : _a.address))
                            throw new Error("Address attestation requires a secondary address.");
                        address = web3WalletProvider.getConnectedWalletData()[0].address;
                        currentProof = this.getSavedProof(address);
                        if (currentProof.data.expiry < Date.now()) {
                            this.deleteProof(address);
                            currentProof = null;
                        }
                        return [4, web3WalletProvider.getSafeConnectProvider()];
                    case 1:
                        safeConnect = _f.sent();
                        if (!!currentProof) return [3, 3];
                        return [4, safeConnect.initSafeConnect()];
                    case 2:
                        _f.sent();
                        currentProof = this.getSavedProof(address);
                        if (!currentProof)
                            throw new Error("Could not get address attestation from safe connect");
                        _f.label = 3;
                    case 3:
                        addrAttest = currentProof.data.attestation;
                        _b = currentProof.data;
                        _d = (_c = AttestedAddress).createAndSignLinkAttestation;
                        _e = [addrAttest, request.options.address];
                        return [4, safeConnect.getLinkSigningKey()];
                    case 4: return [4, _d.apply(_c, _e.concat([_f.sent()]))];
                    case 5:
                        _b.attestation = _f.sent();
                        return [2, currentProof];
                }
            });
        });
    };
    AttestedAddress.createAndSignLinkAttestation = function (addressAttest, linkedEthAddress, holdingPrivKey) {
        return __awaiter(this, void 0, void 0, function () {
            var linkAttest;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        linkAttest = new EthereumKeyLinkingAttestation();
                        linkAttest.create(addressAttest, linkedEthAddress, 3600);
                        return [4, linkAttest.sign(holdingPrivKey)];
                    case 1:
                        _a.sent();
                        return [2, linkAttest.getBase64()];
                }
            });
        });
    };
    return AttestedAddress;
}(AbstractAuthentication));
export { AttestedAddress };
//# sourceMappingURL=attestedAddress.js.map