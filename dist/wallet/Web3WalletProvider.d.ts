import { SafeConnectOptions } from "./SafeConnectProvider";
export declare class Web3WalletProvider {
    state: any;
    safeConnectOptions?: SafeConnectOptions;
    constructor(safeConnectUrl?: SafeConnectOptions);
    connectWith(walletType: string): Promise<any>;
    signWith(message: string, walletProvider: any): Promise<string>;
    getConnectedWalletData(): any;
    registerNewWalletAddress(address: string, chainId: string, provider: any): any;
    MetaMask(): Promise<any>;
    WalletConnect(): Promise<any>;
    Torus(): Promise<any>;
    SafeConnect(): Promise<any>;
    safeConnectAvailable(): boolean;
    getSafeConnectProvider(): Promise<import("./SafeConnectProvider").SafeConnectProvider>;
}
export default Web3WalletProvider;
