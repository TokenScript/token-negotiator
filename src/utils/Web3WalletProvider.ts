import WalletConnectProvider from "@walletconnect/web3-provider";
import Torus from "@toruslabs/torus-embed";
import Web3 from "web3";
import { ethers } from "ethers";

interface WalletConnectionState {
    connections: {
        [index: string]: WalletConnection
    }
}

interface WalletConnection {
    address: string,
    chainId: string,
    providerType: string,
    provider?: Web3WalletProvider
}

class Web3WalletProvider {

	private static LOCAL_STORAGE_KEY = "tn-wallet-connections";

	state: WalletConnectionState = {
		connections: {

		}
	};

	saveConnections(){

		let savedConnections: WalletConnectionState = { connections: {} };

		for (let address in this.state.connections){
			let con = this.state.connections[address];

			savedConnections.connections[address] = {
				address: con.address,
				chainId: con.chainId,
				providerType: con.providerType
			};
		}

		localStorage.setItem(Web3WalletProvider.LOCAL_STORAGE_KEY, JSON.stringify(savedConnections));
	}

	deleteConnections(){
		localStorage.removeItem(Web3WalletProvider.LOCAL_STORAGE_KEY);
	}

	async loadConnections(){

		let data = localStorage.getItem(Web3WalletProvider.LOCAL_STORAGE_KEY);

		if (!data) return;

		let state = JSON.parse(data);

		if (!state) return;

		for (let address in state.connections){

			let connection = state.connections[address];

			// TODO: get provider object and get connection without initialising a new connection
			await this.constructConnection(connection.providerType);
		}

		console.log(this.state);
	}

	async connectWith ( walletType: string ) {

		if(!walletType) throw new Error('Please provide a Wallet type to connect with.');

		await this.constructConnection(walletType);

		this.saveConnections();
	}

	async signWith ( message: string, walletData: any ) {

		let provider = new ethers.providers.Web3Provider(walletData.provider);

		let signer = provider.getSigner();
  
		return await signer.signMessage(message);

	}

	getConnectedWallet(address?: string) {

		if (address){
			if (!this.state.connections[address])
				throw new Error("Connected wallet with address " + address + " does not exist");

			return this.state.connections[address];
		}

		// Backward compatibility with single address mode
		let addresses = Object.keys(this.state.connections);
		if (addresses.length)
			return this.state.connections[addresses[0]];

		throw new Error("No connected wallets exist");
	}

	getConnectedWalletCount(){
		return Object.keys(this.state.connections).length
	}

	registerNewWalletAddress ( address: string, chainId: string, providerType: string, provider: any ) {

		address = address.toLowerCase();
        
		this.state.connections[address] = { address, chainId, providerType, provider };

		return this.state.connections;

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

	async constructConnection(walletType: string){

		switch (walletType){
		case "MetaMask":
			return await this.MetaMask();
		case "WalletConnect":
			return await this.WalletConnect();
		case "Torus":
			return await this.Torus();
		}

		throw new Error("Wallet provider " + walletType + " does not exist.");
	}

	async MetaMask () {

		console.log('connect MetaMask');

		if (typeof window.ethereum !== 'undefined') {

			// @ts-ignore
			// await ethereum.enable(); // fall back may be needed for FF to open Extension Prompt.

			const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

			const hexChainId = await window.ethereum.request({ method: 'eth_chainId' });

			for (let account of accounts){
				this.registerNewWalletAddress(account, parseInt(hexChainId, 16).toString(), "MetaMask", window.ethereum);
			}

			return this.state.connections;

		} else {

			throw new Error("MetaMask is not available. Please check the extension is supported and active.");

		}

	}

	async WalletConnect () {

		console.log('connect Wallet Connect');

		return new Promise((resolve, reject) => {

			try {

				const walletConnectProvider = new WalletConnectProvider({
					infuraId: "7753fa7b79d2469f97c156780fce37ac",
				});

				walletConnectProvider.on("accountsChanged", (accounts: string[]) => {

					console.log(accounts);

					const registeredWalletAddress = this.registerNewWalletAddress(accounts[0], '1', "WalletConnect", walletConnectProvider);

					resolve(registeredWalletAddress);

				});

				walletConnectProvider.on("chainChanged", (chainId: number) => {

					console.log(chainId);

				});

				walletConnectProvider.on("disconnect", (code: number, reason: string) => {

					console.log(code, reason);

				});

				walletConnectProvider.enable().catch(e => {
					reject(e);
				});

			} catch (e){
				reject(e);
			}

		});

	}

	async Torus () {

		console.log('connect Torus');

		const torus = new Torus();

		await torus.init();

		await torus.login();

		// @ts-ignore
		const web3 = new Web3(torus.provider);

		const { accounts, chainId } = await this.getWeb3ChainIdAndAccounts( web3 );

		const registeredWalletAddress = this.registerNewWalletAddress(accounts[0], chainId, "Torus", torus.provider);

		return registeredWalletAddress;

	}

	// async Fortmatic () {

	//     console.log('connect Fortmatic');

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

	//     console.log('connect Portis');

	//     // https://docs.portis.io/#/methods

	//     const portis = new Portis("211b48db-e8cc-4b68-82ad-bf781727ea9e", "rinkeby");

	//     portis.onError(error => { console.log('portis error', error) });

	//     const web3 = new Web3(portis.provider);

	//     const { accounts, chainId } = await this.getWeb3ChainIdAndAccounts( web3 );

	//     const registeredWalletAddress = this.registerNewWalletAddress(accounts[0], chainId, portis.provider);

	//     return registeredWalletAddress;

	// };

	// async Authereum  () {

	//     console.log('connect Authereum');

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
