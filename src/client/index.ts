// @ts-nocheck
import {OutletAction, OutletResponseAction, Messaging} from "./messaging";
import { Ui } from "./ui";
import { logger, requiredParams } from "../utils";
import {getNftCollection, getNftTokens} from "../utils/token/nftProvider";
import "./../vendor/keyShape";
import { Authenticator } from "@tokenscript/attestation";
import {TokenStore} from "./tokenStore";
import {OffChainTokenConfig, OnChainTokenConfig, AuthenticateInterface, NegotiationInterface} from "./interface";
import {SignedUNChallenge} from "./auth/signedUNChallenge";
import {TicketZKProof} from "./auth/ticketZKProof";
import {AuthenticationMethod} from "./auth/abstractAuthentication";
import { isUserAgentSupported } from '../utils/support/isSupported';
import {SelectWallet} from "./views/select-wallet";
import {SelectIssuers} from "./views/select-issuers";

// @ts-ignore
if(typeof window !== "undefined") window.tn = { version: "2.0.0" };

declare global {
	interface Window {
		KeyshapeJS?: any;
		tokenToggleSelection: any;
		ethereum: any;
	}
}

const defaultConfig: NegotiationInterface = {
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
}

export const enum UIUpdateEventType {
	ISSUERS_LOADING,
	ISSUERS_LOADED
}

export enum ClientError {
	POPUP_BLOCKED = "POPUP_BLOCKED",
	USER_ABORT = "USER_ABORT"
}

export enum ClientErrorMessage {
	POPUP_BLOCKED = "Please add an exception to your popup blocker before continuing.",
	USER_ABORT = "The user aborted the process."
}

export class Client {

	private negotiateAlreadyFired: boolean;
	public issuersLoaded: boolean;
	private config: NegotiationInterface;
	private web3WalletProvider: Web3WalletProvider;
	private messaging: Messaging;
	private ui: Ui;
	private clientCallBackEvents: {} = {};
	private tokenStore: TokenStore;
	private uiUpdateCallbacks: {[type: UIUpdateEventType]: (data?: {}) => {}} = {}

	static getKey(file: string){
		return  Authenticator.decodePublicKey(file);
	}

	constructor(config: NegotiationInterface) {

		config.uiOptions = {...defaultConfig.uiOptions, ...config?.uiOptions}

		this.config = Object.assign(defaultConfig, config);

		this.negotiateAlreadyFired = false;

		this.tokenStore = new TokenStore(this.config.autoEnableTokens);

		if (this.config.issuers?.length > 0)
			this.tokenStore.updateIssuers(this.config.issuers);

		this.messaging = new Messaging();
	}

	getTokenStore() {
		return this.tokenStore;
	}

	getUi(){
		return this.ui;
	}

	triggerUiUpdateCallback(type: UIUpdateEventType, data?: {}){
		if (this.uiUpdateCallbacks[type])
			this.uiUpdateCallbacks[type](data);
	}

	public registerUiUpdateCallback(type: UIUpdateEventType, callback: Function){
		this.uiUpdateCallbacks[type] = callback;
	}

	public safeConnectAvailable(){
		return this.config.safeConnectOptions !== undefined;
	}

	public async getWalletProvider(){

		if (!this.web3WalletProvider){
			const {Web3WalletProvider} = await import("./../wallet/Web3WalletProvider");
			this.web3WalletProvider = new Web3WalletProvider(this, this.config.safeConnectOptions);
		}

		return this.web3WalletProvider;
	}

	async negotiatorConnectToWallet(walletType: string) {

		let walletProvider = await this.getWalletProvider();

		let walletAddress = await walletProvider.connectWith(walletType);

		logger(2, "wallet address found: " + walletAddress);

		return walletAddress;
	}

	async enrichTokenLookupDataOnChainTokens() {

		this.issuersLoaded = false;
		this.triggerUiUpdateCallback(UIUpdateEventType.ISSUERS_LOADING);

		let issuers = this.tokenStore.getCurrentIssuers(true);

		for (let issuer in issuers){

			let tokenData = issuers[issuer];

			// Issuer contract data already loaded
			if (tokenData.title)
				continue;

			let lookupData = await getNftCollection(tokenData);

			if (lookupData) {
				// TODO: this might be redundant
				lookupData.onChain = true;

				// enrich the tokenLookup store with contract meta data
				this.tokenStore.updateTokenLookupStore(issuer, lookupData);
			}
		}

		this.issuersLoaded = true;
		this.triggerUiUpdateCallback(UIUpdateEventType.ISSUERS_LOADED);
	}

	async negotiate(issuers?: OnChainTokenConfig | OffChainTokenConfig[], openPopup = false) {

		if (issuers) this.tokenStore.updateIssuers(issuers);

		requiredParams(Object.keys(this.tokenStore.getCurrentIssuers()).length, "issuers are missing.");

		if (this.config.type === "active") {

			this.issuersLoaded = false;

			this.activeNegotiationStrategy(openPopup);

			await this.enrichTokenLookupDataOnChainTokens();
		} else {
			// TODO build logic to allow to connect with wallectConnect, Torus etc.
			// Logic to ask user to connect to wallet when they have provided web3 tokens to negotiate with.
			// See other TODO's in this flow.
			// if (window.ethereum && onChainTokens.tokenKeys.length > 0) await this.web3WalletProvider.connectWith('MetaMask');
			await this.enrichTokenLookupDataOnChainTokens();

			await this.passiveNegotiationStrategy();
		}
	}

	activeNegotiationStrategy(openPopup: boolean) {

		let autoOpenPopup;

		if (this.ui) {
			autoOpenPopup = this.tokenStore.hasUnloadedTokens();
		} else {
			this.ui = new Ui(this.config.uiOptions, this);
			this.ui.initialize();
			autoOpenPopup = true;
		}

		// emit existing cached tokens
		if (this.config.autoEnableTokens && Object.keys(this.tokenStore.getSelectedTokens()).length)
			this.eventSender.emitSelectedTokensToClient(this.tokenStore.getSelectedTokens())

		if (openPopup || (this.config.uiOptions.autoPopup === true && autoOpenPopup))
			this.ui.openOverlay();
	}

	private cancelAutoload = true;

	async tokenAutoLoad(onLoading: (issuer: string) => void, onComplete: (issuer: string, tokens: any[]) => void) {

		if (this.config.autoLoadTokens === false)
			return;

		this.cancelAutoload = false;

		let count = 1;

		for (let issuerKey in this.tokenStore.getCurrentIssuers()){

			let tokens = this.tokenStore.getIssuerTokens(issuerKey)

			if (tokens?.length > 0)
				continue;

			onLoading(issuerKey);

			try {
				let tokens = await this.connectTokenIssuer(issuerKey);

				onComplete(issuerKey, tokens)
			} catch (e){
				e.message = "Failed to load " + issuerKey + ": " + e.message;
				logger(2, e.message);
				this.eventSender.emitErrorToClient(e, issuerKey);
				onComplete(issuerKey, null);
			}

			count++;

			if (this.cancelAutoload || (this.config.autoLoadTokens !== true && count > this.config.autoLoadTokens))
				break;
		}
	}

	cancelTokenAutoload(){
		this.cancelAutoload = true;
	}

	async setPassiveNegotiationWebTokens() {

		let issuers = this.tokenStore.getCurrentIssuers(false);

		for (let issuer in issuers){

			let res;

			const issuerConfig = this.tokenStore.getCurrentIssuers()[issuer] as OffChainTokenConfig;

			try {
				res = await this.messaging.sendMessage({
					action: OutletAction.GET_ISSUER_TOKENS,
					origin: issuerConfig.tokenOrigin,
					data: {
						issuer: issuer,
						filter: issuerConfig.filters
					}
				}, this.config.messagingForceTab);
			} catch (err) {
				logger(2,err);
				console.log("popup error");
				this.eventSender.emitErrorToClient(err, issuer);
				continue;
			}

			logger(2,"tokens:");
			logger(2,res.data.tokens);

			this.tokenStore.setTokens(issuer, res.data.tokens);

		}
	}

	async setPassiveNegotiationOnChainTokens() {

		let issuers = this.tokenStore.getCurrentIssuers(true);
		let walletProvider = await this.getWalletProvider();

		for (let issuerKey in issuers){

			let issuer = issuers[issuerKey];

			try {
				const tokens = await getNftTokens(
					issuer,
					walletProvider.getConnectedWalletData()[0].address
				);

				this.tokenStore.setTokens(issuerKey, tokens);
			} catch (e){
				logger(2,err);
				this.eventSender.emitErrorToClient(err, issuerKey);
			}
		}
	}

	async passiveNegotiationStrategy() {

		await this.setPassiveNegotiationWebTokens();

		await this.setPassiveNegotiationOnChainTokens();

		let tokens = this.tokenStore.getCurrentTokens();

		logger(2, "Emit tokens");
		logger(2, tokens);

		for (let issuer in tokens){
			tokens[issuer] = {tokens: tokens[issuer]};
		}

		this.eventSender.emitAllTokensToClient(tokens);

		// Feature not supported when an end users third party cookies are disabled
		// because the use of a tab requires a user gesture.
		if (this.messaging.core.iframeStorageSupport === false && Object.keys(this.tokenStore.getCurrentTokens(false)).length === 0)
			logger(2,
				"iFrame storage support not detected: Enable popups via your browser to access off-chain tokens with this negotiation type."
			);
	}

	async connectTokenIssuer(issuer: string) {

		const config = this.tokenStore.getCurrentIssuers()[issuer];

		if (!config)
			throw new Error("Undefined token issuer")

		let tokens;

		if (config.onChain === true) {

			let walletProvider = await this.getWalletProvider();

			const walletAddress = walletProvider.getConnectedWalletData()[0]?.address;

			requiredParams(issuer, "issuer is required.");
			requiredParams(walletAddress, "wallet address is missing.");

			tokens = await getNftTokens(config, walletAddress);

			this.tokenStore.setTokens(issuer,  tokens);

		} else {

			let res = await this.messaging.sendMessage({
				action: OutletAction.GET_ISSUER_TOKENS,
				origin: config.tokenOrigin,
				data : {
					issuer: issuer,
					filter: config.filters
				},
			}, this.config.messagingForceTab, this.ui);

			tokens = res.data.tokens;

			this.tokenStore.setTokens(issuer, res.data.tokens);
		}

		if (this.config.autoEnableTokens)
			this.eventSender.emitSelectedTokensToClient(this.tokenStore.getSelectedTokens())

		return tokens;
	}

	updateSelectedTokens(selectedTokens) {
		this.tokenStore.setSelectedTokens(selectedTokens);
		this.eventSender.emitSelectedTokensToClient(selectedTokens);
	}

	isCurrentDeviceSupported(): boolean{
		return isUserAgentSupported(this.config?.unSupportedUserAgent?.config) !== false;
	}

	async authenticate(authRequest: AuthenticateInterface) {
		if(!this.isCurrentDeviceSupported()) {
			if (this.ui) {
				setTimeout(() => {
					this.ui.showError(this.config?.unSupportedUserAgent?.errorMessage ?? "This browser cannot yet support full token authentication. Please try using Chrome, FireFox or Safari.");
					this.ui.openOverlay();
				}, 1000);
			}
			throw new Error(this.config?.unSupportedUserAgent?.errorMessage ?? "This browser cannot yet support full token authentication. Please try using Chrome, FireFox or Safari.");
		}
		const { issuer, unsignedToken } = authRequest;
		requiredParams(
			issuer && unsignedToken,
			"Issuer and signed token required."
		);

		const config = this.tokenStore.getCurrentIssuers()[issuer];

		if (!config)
			throw new Error("Provided issuer was not found.");

		// TODO: How to handle error display in passive negotiation? Use optional UI or emit errors to listener?
		let timer;

		if (this.ui) {
			timer = setTimeout(() => {
				this.ui.showLoader(
					"<h4>Authenticating...</h4>",
					"<small>You may need to sign a new challenge in your wallet</small>"
				);
				this.ui.openOverlay();
			}, 600);
		}

		let AuthType;

		if (authRequest.type){
			AuthType = authRequest.type;
		} else {
			AuthType = config.onChain ? SignedUNChallenge : TicketZKProof;
		}

		let authenticator: AuthenticationMethod = new AuthType(this);

		let res;

		try {
			if (!authRequest.options)
				authRequest.options = {};

			authRequest.options?.messagingForceTab = this.config.messagingForceTab;

			res = await authenticator.getTokenProof(config, [authRequest.unsignedToken], authRequest);

			logger(2,"Ticket proof successfully validated.");

			this.eventSender.emitProofToClient(res.data, issuer);

		} catch (err) {
			logger(2,err);

			if (err.message === "WALLET_REQUIRED"){
				if (timer) clearTimeout(timer);
				return this.handleWalletRequired(authRequest);
			}

			this.handleProofError(err, issuer);
			throw err;
		}

		if (this.ui) {
			if (timer) clearTimeout(timer);
			this.ui.dismissLoader();
			this.ui.closeOverlay();
		}

		return res.data;
	}

	private async handleWalletRequired(authRequest){

		if (this.ui) {
			this.ui.dismissLoader();
			this.ui.openOverlay();
		} else {
			// TODO: Show wallet selection modal for passive mode or emit event instead of connecting metamask automatically
			let walletProvider = await this.getWalletProvider();
			await walletProvider.connectWith("MetaMask");
			return this.authenticate(authRequest);
		}

		return new Promise((resolve, reject) => {
			this.ui.updateUI(SelectWallet, {connectCallback: async () => {
				this.ui.updateUI(SelectIssuers);
				try {
					let res = await this.authenticate(authRequest);
					resolve(res);
				} catch (e){
					reject(e);
				}
			}});
		});
	}

	private handleProofError(err, issuer) {
		if (this.ui) this.ui.showError(err);
		this.eventSender.emitProofToClient(null, issuer, err);
	}

	eventSender = {
		// TODO: consolidate these events
		emitAllTokensToClient: (tokens: any) => {
			this.on("tokens", null, tokens);
		},
		emitSelectedTokensToClient: (tokens: any) => {
			this.on("tokens-selected", null, { selectedTokens: tokens });
		},
		emitProofToClient: (data: any, issuer: any, error = "") => {
			this.on("token-proof", null, { data, issuer, error });
		},
		emitErrorToClient: (error: Error, issuer = "none") => {
			this.on("error", null, {error, issuer});
		}
	};

	async addTokenViaMagicLink(magicLink: any) {
		let url = new URL(magicLink);
		let params =
			url.hash.length > 1 ? url.hash.substring(1) : url.search.substring(1);

		let res = await this.messaging.sendMessage({
			action: OutletAction.MAGIC_URL,
			origin: url.origin + url.pathname,
			data: {
				urlParams: params
			}
		}, this.config.messagingForceTab);

		if (res.evt === OutletResponseAction.ISSUER_TOKENS) return res.data.tokens;

		throw new Error(res.errors.join("\n"));
	}

	on(type: string, callback?: any, data?: any) {
		requiredParams(type, "Event type is not defined");

		if (callback) {
			// assign callback reference to web developers event e.g. negotiator.on('tokens', (tokensForWebPage) => { ... }));

			this.clientCallBackEvents[type] = callback;
		} else {
			// event types: 'tokens', 'tokens-selected', 'proof'

			if (this.clientCallBackEvents[type]) {
				return this.clientCallBackEvents[type].call(type, data);
			}
		}
	}
}
