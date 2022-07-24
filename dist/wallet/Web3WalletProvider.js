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
import { ethers } from "ethers";
import { logger } from "../utils";
var Web3WalletProvider = (function () {
    function Web3WalletProvider(safeConnectUrl) {
        this.state = { addresses: [] };
        this.safeConnectOptions = safeConnectUrl;
    }
    Web3WalletProvider.prototype.connectWith = function (walletType) {
        return __awaiter(this, void 0, void 0, function () {
            var address;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!walletType)
                            throw new Error('Please provide a Wallet type to connect with.');
                        if (!this[walletType]) return [3, 2];
                        return [4, this[walletType]()];
                    case 1:
                        address = _a.sent();
                        logger(2, 'address', address);
                        return [2, address];
                    case 2: throw new Error('Wallet type not found');
                }
            });
        });
    };
    Web3WalletProvider.prototype.signWith = function (message, walletProvider) {
        return __awaiter(this, void 0, void 0, function () {
            var provider, signer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        provider = new ethers.providers.Web3Provider(walletProvider);
                        signer = provider.getSigner();
                        return [4, signer.signMessage(message)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Web3WalletProvider.prototype.getConnectedWalletData = function () {
        return this.state.addresses;
    };
    Web3WalletProvider.prototype.registerNewWalletAddress = function (address, chainId, provider) {
        this.state.addresses.push({ address: address, chainId: chainId, provider: provider });
        return this.state.addresses;
    };
    Web3WalletProvider.prototype.MetaMask = function () {
        return __awaiter(this, void 0, void 0, function () {
            var accounts, hexChainId, accountAddress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger(2, 'connect MetaMask');
                        if (!(typeof window.ethereum !== 'undefined')) return [3, 3];
                        return [4, window.ethereum.request({ method: 'eth_requestAccounts' })];
                    case 1:
                        accounts = _a.sent();
                        return [4, window.ethereum.request({ method: 'eth_chainId' })];
                    case 2:
                        hexChainId = _a.sent();
                        accountAddress = accounts[0];
                        return [2, this.registerNewWalletAddress(accountAddress, parseInt(hexChainId, 16), ethereum)];
                    case 3: throw new Error("MetaMask is not available. Please check the extension is supported and active.");
                }
            });
        });
    };
    Web3WalletProvider.prototype.WalletConnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var walletConnectProvider, walletConnect, provider, accounts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger(2, 'connect Wallet Connect');
                        return [4, import("./WalletConnectProvider")];
                    case 1:
                        walletConnectProvider = _a.sent();
                        return [4, walletConnectProvider.getWalletConnectProviderInstance()];
                    case 2:
                        walletConnect = _a.sent();
                        return [4, walletConnect.enable()];
                    case 3:
                        _a.sent();
                        provider = new ethers.providers.Web3Provider(walletConnect);
                        return [4, provider.listAccounts()];
                    case 4:
                        accounts = _a.sent();
                        if (accounts.length === 0) {
                            throw new Error("No accounts found via wallet-connect.");
                        }
                        return [2, this.registerNewWalletAddress(accounts[0], '1', walletConnect)];
                }
            });
        });
    };
    Web3WalletProvider.prototype.Torus = function () {
        return __awaiter(this, void 0, void 0, function () {
            var TorusProvider, torus, provider, accounts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, import("./TorusProvider")];
                    case 1:
                        TorusProvider = _a.sent();
                        return [4, TorusProvider.getTorusProviderInstance()];
                    case 2:
                        torus = _a.sent();
                        return [4, torus.init()];
                    case 3:
                        _a.sent();
                        return [4, torus.login()];
                    case 4:
                        _a.sent();
                        provider = new ethers.providers.Web3Provider(torus.provider);
                        return [4, provider.listAccounts()];
                    case 5:
                        accounts = _a.sent();
                        if (accounts.length === 0) {
                            throw new Error("No accounts found via wallet-connect.");
                        }
                        return [2, this.registerNewWalletAddress(accounts[0], '1', torus.provider)];
                }
            });
        });
    };
    Web3WalletProvider.prototype.SafeConnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var provider, address;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger(2, 'connect SafeConnect');
                        return [4, this.getSafeConnectProvider()];
                    case 1:
                        provider = _a.sent();
                        return [4, provider.initSafeConnect()];
                    case 2:
                        address = _a.sent();
                        console.log(address);
                        this.registerNewWalletAddress(address, "1", provider);
                        return [2, address];
                }
            });
        });
    };
    Web3WalletProvider.prototype.safeConnectAvailable = function () {
        return this.safeConnectOptions !== undefined;
    };
    Web3WalletProvider.prototype.getSafeConnectProvider = function () {
        return __awaiter(this, void 0, void 0, function () {
            var SafeConnectProvider;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, import("./SafeConnectProvider")];
                    case 1:
                        SafeConnectProvider = (_a.sent()).SafeConnectProvider;
                        return [2, new SafeConnectProvider(this.safeConnectOptions)];
                }
            });
        });
    };
    return Web3WalletProvider;
}());
export { Web3WalletProvider };
export default Web3WalletProvider;
//# sourceMappingURL=Web3WalletProvider.js.map