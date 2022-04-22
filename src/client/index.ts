// @ts-nocheck
import { Messaging, MessageAction, MessageResponseAction } from "./messaging";
import { Popup, PopupOptionsInterface } from './popup';
import { asyncHandle, logger, requiredParams } from '../utils';
import { connectMetamaskAndGetAddress, getChallengeSigned, validateUseEthKey } from "../core";
import { OffChainTokenConfig, OnChainTokenConfig, tokenLookup } from '../tokenLookup';
import OnChainTokenModule from './../onChainTokenModule'
import Web3WalletProvider from './../utils/Web3WalletProvider';
import './../vendor/keyShape';

interface NegotiationInterface {
    type: string;
    issuers: (OnChainTokenConfig | OffChainTokenConfig)[];
    options: {
        overlay: PopupOptionsInterface,
        filters: {}
    };
    onChainKeys?: {[apiName: string]: string}
}

declare global {
    interface Window {
        KeyshapeJS?: any;
        tokenToggleSelection: any;
        ethereum: any;
    }
}

// TODO: Implement tokenId - each issuer token should have a unique ID (tokenId for instance).
//  webster should not be required to pass the whole object as it can lead to hard to solve errors for webster.
interface AuthenticateInterface {
    issuer: any;
    tokenId?: number|string
    token: any;
}

export class Client {

    private issuers: OnChainTokenConfig | OffChainTokenConfig[];
    private type: string;
    private filter: {};
    private options: any;
    private offChainTokens: any;
    private onChainTokens: any;
    private tokenLookup: any;
    private selectedTokens: any;
    private web3WalletProvider: any;
    private messaging: Messaging;
    private popup: Popup;
    private clientCallBackEvents: {};
    private onChainTokenModule: OnChainTokenModule;

    constructor(config: NegotiationInterface) {

        const { type, issuers, options, filter } = config;

        requiredParams(type, 'type is required.');

        requiredParams(issuers, 'issuers are missing.');

        // TODO: Remove token lookup and use issuers instead - pretty much the same data
        this.tokenLookup = tokenLookup;

        this.type = type;

        this.options = options;

        this.filter = filter ? filter : {};

        this.issuers = issuers;

        this.offChainTokens = { tokenKeys: [] };

        this.onChainTokens = { tokenKeys: [] };

        this.selectedTokens = {};

        this.clientCallBackEvents = {};

        this.prePopulateTokenLookupStore(issuers);

        // currently custom to Token Negotiator
        this.web3WalletProvider = new Web3WalletProvider();

        // on chain token manager module
        this.onChainTokenModule = new OnChainTokenModule(config.onChainKeys);

        this.messaging = new Messaging();

    }

    prePopulateTokenLookupStore = (issuers: any) => {

        issuers.forEach((issuer: any) => {

            let issuerKey = issuer.collectionID;

            issuerKey = issuerKey.replace(/\s+/g, '-').toLowerCase();

            // Populate the token lookup store with initial data.
            this.updateTokenLookupStore(issuerKey, issuer);

            if ((issuer.contract) && (issuer.chain)) {

                // stop duplicate entries
                if (this.onChainTokens[issuerKey]) { 
                    console.warn(`duplicate collectionID key ${issuerKey}, use unique keys per collection.`);
                    return;
                }

                issuer.chain = issuer.chain.toLocaleLowerCase();

                // add onchain token (non-tokenscipt)
                this.onChainTokens.tokenKeys.push(issuerKey);

                // add empty tokens list (non-tokenscript)
                this.onChainTokens[issuerKey] = { tokens: [] };

            } else {

                // off chain token attestations 

                this.offChainTokens.tokenKeys.push(issuerKey);

                this.offChainTokens[issuerKey] = { tokens: [] };

            }

        });
    }

    getTokenData() {
        return {
            offChainTokens: this.offChainTokens,
            onChainTokens: this.onChainTokens,
            tokenLookup: this.tokenLookup,
            selectedTokens: this.selectedTokens
        };
    }

    // To enrich the token lookup store with data.
    // for on chain tokens that are not using token script this is 
    // required, for off chain this is most likely not required because the configurations
    // are already pre-defined e.g. title, issuer image image etc.
    updateTokenLookupStore(tokenKey, data) {

        if (!this.tokenLookup[tokenKey]) this.tokenLookup[tokenKey] = {};

        this.tokenLookup[tokenKey] = { ...this.tokenLookup[tokenKey], ...data };

    }

    async negotiatorConnectToWallet(walletType: string) {

        let walletAddress = await this.web3WalletProvider.connectWith(walletType);

        logger('wallet address found: ' + walletAddress);

        return walletAddress;

    }

    async setPassiveNegotiationWebTokens(offChainTokens: any) {

        await Promise.all(offChainTokens.tokenKeys.map(async (issuer: string): Promise<any> => {

            let data;

            const tokensOrigin = this.tokenLookup[issuer].tokenOrigin;

            try {
                data = await this.messaging.sendMessage({
                    issuer: issuer,
                    action: MessageAction.GET_ISSUER_TOKENS,
                    filter: this.filter,
                    origin: tokensOrigin
                });
            } catch (err) {
                console.log(err);
                return;
            }

            console.log("tokens:");
            console.log(data.tokens);

            this.offChainTokens[issuer].tokens = data.tokens;

            return;

        }));

    }

    async enrichTokenLookupDataOffChainTokens(offChainTokens: any) {

        // TODO: Fetch offline token config from ticket issuer url
        /*await Promise.all(offChainTokens.tokenKeys.map(async (issuerKey: string): Promise<any> => {

            return fetch(`${this.tokenLookup[issuerKey].tokenConfigURI}`, {})
            .then(response => response.json())
            .then(response => {
                this.updateTokenLookupStore(issuerKey, response);
            })
            .catch(err => console.error(err));

        }));*/

    }

    async enrichTokenLookupDataOnChainTokens(onChainTokens: any) {

        await Promise.all(onChainTokens.tokenKeys.map(async (issuerKey: string): Promise<any> => {

            let lookupData = await this.onChainTokenModule.getInitialContractAddressMetaData(this.tokenLookup[issuerKey]);

            if (lookupData) {

                lookupData.onChain = true;

                // enrich the tokenLookup store with contract meta data
                this.updateTokenLookupStore(issuerKey, lookupData);
            }

        }));

    }

    async negotiate() {

        /*
            ------------------------------
            blockchain token reader module
            ------------------------------
        
            * await this.setBlockchainTokens(this.onChainTokens);
        */

        // if storage support - embed iframe for active and passive negotiation flows.
        // else open with window each time.

        // Enrich the look up data with the accepted on chain tokens
        await this.enrichTokenLookupDataOnChainTokens(this.onChainTokens);
        await this.enrichTokenLookupDataOffChainTokens(this.offChainTokens);

        if (this.type === 'active') {

            this.activeNegotiationStrategy();

        } else {

            if (window.ethereum) await this.web3WalletProvider.connectWith('MetaMask');

            this.passiveNegotiationStrategy();

        }

    }

    async activeNegotiationStrategy() {

        setTimeout(() => {

            this.popup = new Popup(this.options?.overlay, this);
            this.popup.initialize();

        }, 0);

    }

    async setPassiveNegotiationOnChainTokens(onChainTokens: any) {

        await Promise.all(onChainTokens.tokenKeys.map(async (issuerKey: string): Promise<any> => {

            const issuer = this.tokenLookup[issuerKey];

            const tokens = await this.onChainTokenModule.connectOnChainToken(
                issuer,
                this.web3WalletProvider.getConnectedWalletData()[0].address
            );

            this.onChainTokens[issuerKey].tokens = tokens;

        }));

    }

    async passiveNegotiationStrategy() {

        // Feature not supported when an end users third party cookies are disabled
        // because the use of a tab requires a user gesture.
        // TODO: this check should be skipped if there is no offchain tokens
        //       if there are offchain tokens, but there are also onchain tokens, show loaded tokens along with an error/warning message?

        let canUsePassive = false;

        if (this.offChainTokens.tokenKeys.length) {
            canUsePassive = await this.messaging.getCookieSupport(this.tokenLookup[this.offChainTokens.tokenKeys[0]]?.tokenOrigin);
        }

        if (canUsePassive) {

            await asyncHandle(this.setPassiveNegotiationWebTokens(this.offChainTokens));
            await asyncHandle(this.setPassiveNegotiationOnChainTokens(this.onChainTokens));

            let outputOnChain = JSON.parse(JSON.stringify(this.onChainTokens));

            delete outputOnChain.tokenKeys;

            let outputOffChain = JSON.parse(JSON.stringify(this.offChainTokens));

            delete outputOffChain.tokenKeys;

            console.log("Emit tokens");
            console.log(outputOffChain);

            this.eventSender.emitAllTokensToClient({ ...outputOffChain, ...outputOnChain });

        } else {

            logger('Enable 3rd party cookies via your browser settings to use this negotiation type.');

        }

    }

    async connectTokenIssuer(issuer: string): Promise<any[]> {

        const filter = this.filter ? this.filter : {};
        const tokensOrigin = this.tokenLookup[issuer].tokenOrigin;

        if (this.tokenLookup[issuer].onChain) {
            return this.connectOnChainTokenIssuer(this.tokenLookup[issuer]);
        }

        let data = await this.messaging.sendMessage({
            issuer: issuer,
            action: MessageAction.GET_ISSUER_TOKENS,
            origin: tokensOrigin,
            filter: filter,
        });

        this.offChainTokens[issuer].tokens = data.tokens;

        return data.tokens;
    }

    async connectOnChainTokenIssuer(issuer: any) {

        const tokens = await this.onChainTokenModule.connectOnChainToken(
            issuer,
            this.web3WalletProvider.getConnectedWalletData()[0].address
        );

        this.onChainTokens[issuer.collectionID].tokens = tokens;

        return tokens;
    }

    updateSelectedTokens(selectedTokens) {

        this.selectedTokens = selectedTokens;

        this.eventSender.emitSelectedTokensToClient();
    }

    createSignature() {
        // TODO msg to include window.location.host
    }

    async authenticateOnChain(authRequest: AuthenticateInterface) {

        // TODO implement onchain authentication & update api accordingly for end user.

        // const { selectedNFTs, message } = authRequest;
        // e.g. message = window.location.host
        // const signature = await signMessageWithBrowserWallet(message, this.web3WalletProvider);
        // send message to backend server
        // const response = await fetch(endPoint, {
        //     method: 'POST',
        //     cache: 'no-cache',
        //     headers: { 'Content-Type': 'application/json' },
        //     redirect: 'follow',
        //     referrerPolicy: 'no-referrer',
        //     body: JSON.stringify({ 
        //         signature: signature,
        //         nfts: selectedNFTs,
        //         message: message
        //      })
        // });

        // mock backend server here / go direct to sever module
        // const server = new Server();
        // const result = await server.resolveNFTTokenOwnership();
        // console.log(result);

        const { issuer, unsignedToken } = authRequest;

        let signedChallenge =  await this.checkPublicAddressMatch(issuer, unsignedToken);

        if (!signedChallenge) {
            throw new Error("Address does not match")
        }

        return {issuer: issuer, proof: signedChallenge};
    }

    async authenticateOffChain(authRequest: AuthenticateInterface){

        const { issuer, unsignedToken } = authRequest;
        const tokensOrigin = this.tokenLookup[issuer].tokenOrigin;

        const addressMatch = await this.checkPublicAddressMatch(issuer, unsignedToken);

        if (!addressMatch) {
            throw new Error("Address does not match")
        }

        return this.messaging.sendMessage({
            issuer: issuer,
            action: MessageAction.GET_PROOF,
            origin: tokensOrigin,
            token: unsignedToken,
            timeout: 0 // Don't time out on this event as it needs active input from the user
        });
    }

    async authenticate(authRequest: AuthenticateInterface) {

        const { issuer, unsignedToken } = authRequest;
        requiredParams((issuer && unsignedToken), "Issuer and signed token required.");

        if (!this.tokenLookup[issuer])
            throw new Error("Provided issuer was not found.");

        // TODO: How to handle error display in passive negotiation? Use optional UI or emit errors to listener?
        let timer;

        if (this.popup) {
            timer = setTimeout(() => {
                this.popup.showLoader(
                    "<h4>Authenticating...</h4>",
                    "<small>You may need to sign a new challenge in your wallet</small>"
                );
                this.popup.openOverlay(true);
            }, 1000);
        }

        try {

            let data;

            if (this.tokenLookup[issuer].onChain){
                data = await this.authenticateOnChain(authRequest);
            } else {
                data = await this.authenticateOffChain(authRequest);
            }

            this.eventSender.emitProofToClient(data.proof, data.issuer);

        } catch (err) {
            console.log(err);
            if (this.popup)
                this.popup.showError(err.message);
            throw new Error(err);
        }

        if (this.popup) {
            if (timer) clearTimeout(timer);
            this.popup.dismissLoader();
            this.popup.closeOverlay();
        }
    }

    async checkPublicAddressMatch(issuer: string, unsignedToken: any) {

        let config:any = tokenLookup[issuer];

        // TODO: Remove once fully implemented for on-chain tokens
        if (!config.unEndPoint) {
            config = {unEndPoint: "https://crypto-verify.herokuapp.com/use-devcon-ticket", ethKeyitemStorageKey: "dcEthKeys"};
        }

        if (!unsignedToken) return { status: false, useEthKey: null, proof: null };

        //try {

            let useEthKey = await getChallengeSigned(config, this.web3WalletProvider);

            const attestedAddress = await validateUseEthKey(config.unEndPoint, useEthKey);

            const walletAddress = await connectMetamaskAndGetAddress();

            if (walletAddress.toLowerCase() !== attestedAddress.toLowerCase()) throw new Error('useEthKey validation failed.');

            return useEthKey;

        //} catch (e) {

            //requiredParams(null, "Could not authenticate token: " + e.message);

        //}

    }

    eventSender = {
        emitAllTokensToClient: (tokens: any) => {

            this.on("tokens", null, tokens);

        },
        emitSelectedTokensToClient: () => {

            this.on("tokens-selected", null, { selectedTokens: this.selectedTokens });

        },
        emitProofToClient: (proof: any, issuer: any) => {

            this.on("token-proof", null, { proof: proof, issuer: issuer });

        }
    }

    async addTokenViaMagicLink(magicLink: any) {

        let url = new URL(magicLink);
        let params = url.hash.length > 1 ? url.hash.substring(1) : url.search.substring(1);

        let data = await this.messaging.sendMessage({
            action: MessageAction.MAGIC_URL,
            urlParams: params,
            origin: url.origin + url.pathname
        });

        if (data.evt == MessageResponseAction.ISSUER_TOKENS)
            return data.tokens;

        throw new Error(data.errors.join("\n"));
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
