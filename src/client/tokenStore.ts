import {OffChainTokenConfig, OnChainTokenConfig} from "./interface";
import {logger} from "../utils";

interface TokenLookup {
	[collectionID: string]: OnChainTokenConfig | OffChainTokenConfig
}

type TokenConfig = OnChainTokenConfig | OffChainTokenConfig;

export class TokenStore {

	private currentIssuers: {[issuer: string]: boolean} = {}; // mapping of issuer to on/off chain

	//  TODO: We could also store this data in local storage to speed up loading on sites that are not a SPA.
	// Cached token data
	private tokens: {[issuer: string]: []} = {};
	// Cached issuer data for contract level metadata
	private tokenLookup: TokenLookup = {};
	// TODO: change to disabled tokens
	private selectedTokens: any = {};
	private autoEnableTokens: boolean;

	constructor(autoEnableTokens: boolean){
		this.autoEnableTokens = autoEnableTokens;
	}

	public updateIssuers(issuers: TokenConfig[]){

		if (Object.keys(this.currentIssuers).length > 0) {
			this.selectedTokens = {};
		}

		this.prePopulateTokenLookupStore(issuers);
	}

	public hasOnChainTokens() {

		for (let i in this.currentIssuers){
			if (this.currentIssuers[i])
				return true;
		}

		return false;
	}

	public getCurrentIssuers(onChainFilter?: boolean){
		let current: TokenLookup = {};
		for (let collectionId in this.currentIssuers){
			if (onChainFilter === undefined || onChainFilter === this.currentIssuers[collectionId])
				current[collectionId] = this.tokenLookup[collectionId];
		}
		return current;
	}

	public getCurrentTokens(onChainFilter?: boolean){
		let current: {[issuer: string]: []} = {};
		for (let collectionId in this.currentIssuers){
			if (onChainFilter === undefined || onChainFilter === this.currentIssuers[collectionId])
				current[collectionId] = this.tokens[collectionId];
		}
		return current;
	}

	public hasUnloadedTokens(){
		for (let tokens of Object.values(this.getCurrentTokens())){
			if (tokens.length === 0)
				return true;
		}
		return false;
	}

	public getIssuerTokens(issuer: string){
		if (this.tokens[issuer])
			return this.tokens[issuer];
		return null;
	}

	public setTokens(issuer: string, tokens: []){
		this.tokens[issuer] = tokens;

		if (this.autoEnableTokens)
			this.selectedTokens[issuer] = { tokens: tokens }
	}

	public getSelectedTokens(){
		return this.selectedTokens;
	}

	public setSelectedTokens(selectedTokens: any){
		this.selectedTokens = selectedTokens;
	}

	private prePopulateTokenLookupStore(issuers: TokenConfig[]) {

		let collectionIds: {[issuer: string]: boolean} = {};

		issuers.forEach((issuer: TokenConfig, i ) => {
			if (!issuer.collectionID) return;

			if(issuer.onChain === undefined) issuer.onChain = true;
			
			issuer.collectionID = this.formatCollectionID(issuer.collectionID);

			if (collectionIds[issuer.collectionID] !== undefined){
				logger(1, `duplicate collectionID key ${issuer.collectionID}, use unique keys per collection.`);
				return;
			}

			if ("chain" in issuer)
				issuer.chain = this.formatCollectionChain(issuer.chain);

			if (this.tokens[issuer.collectionID] !== undefined){
				if (this.autoEnableTokens && this.tokens[issuer.collectionID].length)
					this.selectedTokens[issuer.collectionID] = { tokens: this.tokens[issuer.collectionID] }
			} else {
				this.tokens[issuer.collectionID] = [];
			}

			// Don't overwrite config of existing/cached issuers
			if (!this.tokenLookup[issuer.collectionID])
				this.updateTokenLookupStore(issuer.collectionID, issuer);

			collectionIds[issuer.collectionID] = issuer.onChain;
		});

		this.currentIssuers = collectionIds;
	}

	// To enrich the token lookup store with data.
	// for on chain tokens that are not using token script this is
	// required, for off chain this is most likely not required because the configurations
	// are already pre-defined e.g. title, issuer image image etc.
	public updateTokenLookupStore(tokenKey: string, data: OnChainTokenConfig | OffChainTokenConfig) {

		this.tokenLookup[tokenKey] = { ...this.tokenLookup[tokenKey], ...data };
	}

	private formatCollectionChain(chain: string) {
		return chain.toLowerCase();
	}

	private formatCollectionID(collectionID: string) {
		let formatedCollectionID = collectionID;

		if (/[A-Z]+/g.test(collectionID) || /\s+/g.test(collectionID)) {
			formatedCollectionID = collectionID.replace(/\s+/g, "-").toLowerCase();

			logger(1, `Token Negotiator: Spaces or capital letters found in collectionID definition ${collectionID}, this has been re-formatted to ${formatedCollectionID}`);

			collectionID = formatedCollectionID;
		}

		return collectionID;
	}
}