import { ethers } from "ethers";
import { logger } from "../utils";
import {SafeConnectOptions} from "./SafeConnectProvider";
import {Client} from "../client";

export class Web3WalletProvider {

	state: any;
	safeConnectOptions?: SafeConnectOptions;
	client: Client;

	constructor(client: Client, safeConnectOptions?: SafeConnectOptions) {

		this.state = { addresses: [ /* { address, chainId, provider } */ ] };

		this.client = client;
		this.safeConnectOptions = safeConnectOptions;
	}

	async connectWith ( walletType: string ) {

		if(!walletType) throw new Error('Please provide a Wallet type to connect with.');

		if(this[walletType as keyof Web3WalletProvider]) {
            
			const address = await this[walletType as keyof Web3WalletProvider]();

			logger(2, 'address', address);

			return address;
             
		} else {

			throw new Error('Wallet type not found');

		}

	}

	async signWith ( message: string, walletProvider: any ) {

		let provider = new ethers.providers.Web3Provider(walletProvider);

		let signer = provider.getSigner();
  
		return await signer.signMessage(message);

	}

	getConnectedWalletData () {

		return this.state.addresses;

	}

	registerNewWalletAddress ( address: string, chainId: string, provider: any ) {
        
		this.state.addresses.push({ address, chainId, provider });

		return this.state.addresses;

	}

	async getWeb3ChainId ( web3: any) {

		return web3.eth.getChainId();

	}

	async getWeb3Accounts( web3: any ) {

		return web3.eth.getAccounts();

	}

	async getWeb3ChainIdAndAccounts( web3: any ) {

		const chainId = await this.getWeb3ChainId( web3 );
        
		const accounts = await this.getWeb3Accounts( web3 );

		return { chainId, accounts };

	}

	async MetaMask () {

		logger(2, 'connect MetaMask');
      
		if (typeof window.ethereum !== 'undefined') {

			// @ts-ignore
			// await ethereum.enable(); // fall back may be needed for FF to open Extension Prompt.
            
			const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            
			const hexChainId = await window.ethereum.request({ method: 'eth_chainId' });

			const accountAddress = accounts[0];

			// @ts-ignore
			return this.registerNewWalletAddress(accountAddress, parseInt(hexChainId, 16), ethereum);

		} else {

			throw new Error("MetaMask is not available. Please check the extension is supported and active.");

		}
        
	}

	async WalletConnect () {

		logger(2, 'connect Wallet Connect');

		const walletConnectProvider = await import("./WalletConnectProvider");

		const walletConnect = await walletConnectProvider.getWalletConnectProviderInstance();

		await walletConnect.enable();

		const provider = new ethers.providers.Web3Provider(walletConnect);
		const accounts = await provider.listAccounts();

		if (accounts.length === 0){
			throw new Error("No accounts found via wallet-connect.");
		}

		return this.registerNewWalletAddress(accounts[0], '1',  walletConnect);

	}

	async Torus () {

		const TorusProvider = await import("./TorusProvider");

		const torus = await TorusProvider.getTorusProviderInstance();
        
		await torus.init();

		await torus.login();

		const web3 = new ethers.providers.Web3Provider(torus.provider);

		const { accounts, chainId } = await this.getWeb3ChainIdAndAccounts( web3 );

		const registeredWalletAddress = this.registerNewWalletAddress(accounts[0], chainId, torus.provider);

		return registeredWalletAddress;

	}

	async SafeConnect(){

		logger(2, 'connect SafeConnect');

		const provider = await this.getSafeConnectProvider();

		const address = await provider.initSafeConnect();

		this.registerNewWalletAddress(address, "1", provider);

		return address;
	}

	safeConnectAvailable(){
		return this.safeConnectOptions !== undefined;
	}

	async getSafeConnectProvider(){

		const {SafeConnectProvider} = await import("./SafeConnectProvider");

		return new SafeConnectProvider(this.client.getUi(), this.safeConnectOptions);
	}

	// async Fortmatic () {

	//     logger(2, 'connect Fortmatic');

	//     // https://replit.com/@fortmatic/demo-kitchen-sink

	//     // const fm = new Fortmatic('pk_test_96DF5BB9127A2C79');

	//     const fm = new Fortmatic('pk_live_7F5E8827DC55A364');
        
	//     const fortmaticProvider = fm.getProvider();

	//     // @ts-ignore
	//     const web3 = new Web3(fortmaticProvider);

	//     const { accounts, chainId } = await this.getWeb3ChainIdAndAccounts( web3 );

	//     const registeredWalletAddress = this.registerNewWalletAddress(accounts[0], chainId, fortmaticProvider);

	//     return registeredWalletAddress;

	// };

	// async Portis () {

	//     logger(2, 'connect Portis');

	//     // https://docs.portis.io/#/methods

	//     const portis = new Portis("211b48db-e8cc-4b68-82ad-bf781727ea9e", "rinkeby");

	//     portis.onError(error => { logger(2, 'portis error', error) });

	//     const web3 = new Web3(portis.provider);

	//     const { accounts, chainId } = await this.getWeb3ChainIdAndAccounts( web3 );

	//     const registeredWalletAddress = this.registerNewWalletAddress(accounts[0], chainId, portis.provider);

	//     return registeredWalletAddress;
        
	// };

	// async Authereum  () {

	//     logger(2, 'connect Authereum');

	//     const authereum = new Authereum('kovan');

	//     const authereumProvider = authereum.getProvider();

	//     const web3 = new Web3(authereumProvider);

	//     await authereumProvider.enable();

	//     const { accounts, chainId } = await this.getWeb3ChainIdAndAccounts( web3 );

	//     const registeredWalletAddress = this.registerNewWalletAddress(accounts[0], chainId, authereumProvider);

	//     return registeredWalletAddress;

	// };

}

export default Web3WalletProvider;
