import { Ui } from "./ui";
import "./../vendor/keyShape";
import { TokenStore } from "./tokenStore";
import { OffChainTokenConfig, OnChainTokenConfig, AuthenticateInterface, NegotiationInterface } from "./interface";
declare global {
    interface Window {
        KeyshapeJS?: any;
        tokenToggleSelection: any;
        ethereum: any;
    }
}
export declare const enum UIUpdateEventType {
    ISSUERS_LOADING = 0,
    ISSUERS_LOADED = 1
}
export declare class Client {
    private negotiateAlreadyFired;
    issuersLoaded: boolean;
    private config;
    private web3WalletProvider;
    private messaging;
    private ui;
    private clientCallBackEvents;
    private tokenStore;
    private uiUpdateCallbacks;
    static getKey(file: string): import("@tokenscript/attestation/dist/libs/KeyPair").KeyPair;
    constructor(config: NegotiationInterface);
    getTokenStore(): TokenStore;
    getUi(): Ui;
    triggerUiUpdateCallback(type: UIUpdateEventType, data?: {}): void;
    registerUiUpdateCallback(type: UIUpdateEventType, callback: Function): void;
    safeConnectAvailable(): boolean;
    private getWalletProvider;
    negotiatorConnectToWallet(walletType: string): Promise<any>;
    setPassiveNegotiationWebTokens(): Promise<void>;
    enrichTokenLookupDataOnChainTokens(): Promise<void>;
    negotiate(issuers?: OnChainTokenConfig | OffChainTokenConfig[], openPopup?: boolean): Promise<void>;
    checkBrowserSupport(): boolean;
    activeNegotiationStrategy(openPopup: boolean): void;
    private cancelAutoload;
    tokenAutoLoad(onLoading: (issuer: string) => void, onComplete: (issuer: string, tokens: any[]) => void): Promise<void>;
    cancelTokenAutoload(): void;
    setPassiveNegotiationOnChainTokens(): Promise<void>;
    passiveNegotiationStrategy(): Promise<void>;
    connectTokenIssuer(issuer: string): Promise<any>;
    updateSelectedTokens(selectedTokens: any): void;
    isCurrentDeviceSupported(): boolean;
    authenticate(authRequest: AuthenticateInterface): Promise<any>;
    private handleProofError;
    eventSender: {
        emitAllTokensToClient: (tokens: any) => void;
        emitSelectedTokensToClient: (tokens: any) => void;
        emitProofToClient: (data: any, issuer: any, error?: string) => void;
    };
    addTokenViaMagicLink(magicLink: any): Promise<any>;
    on(type: string, callback?: any, data?: any): any;
}
