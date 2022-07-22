import {AuthenticateInterface, OffChainTokenConfig, OnChainTokenConfig} from "../interface";
import Web3WalletProvider from "../../wallet/Web3WalletProvider";
import {Client} from "../index";

export interface AuthenticationResult {
	type: string,
	data: any,
	target: {
		address?: string,
		tokens?: []
	}
}

export interface AuthenticationMethod {
	TYPE: string;
	getTokenProof(issuerConfig: OnChainTokenConfig | OffChainTokenConfig, tokens: Array<any>, request: AuthenticateInterface): Promise<AuthenticationResult>;
}

export abstract class AbstractAuthentication {

	public abstract TYPE: string;

	public static STORAGE_KEY = "tn-proof";

	protected client: Client;

	constructor(client?: Client) {
		this.client = client;
	}

	public saveProof(key: string, proof: AuthenticationResult){

		const challenges = this.getProofs();

		challenges[this.getFullKey(key)] = proof;

		localStorage.setItem(
			AbstractAuthentication.STORAGE_KEY,
			JSON.stringify(challenges)
		);
	}

	protected getSavedProof(key: string){

		const challenges = this.getProofs();
		const fullKey = this.getFullKey(key);

		if (challenges[fullKey]){
			return challenges[fullKey];
		}

		return null;
	}

	protected deleteProof(key: string){

		const challenges = this.getProofs();
		const fullKey = this.getFullKey(key);

		if (challenges[fullKey])
			delete challenges[fullKey];

		localStorage.setItem(AbstractAuthentication.STORAGE_KEY, JSON.stringify(challenges));
	}

	private getFullKey(key: string){
		return this.TYPE + "-" + key.toLowerCase();
	}

	private getProofs(): {[key: string]: AuthenticationResult}{
		const data = localStorage.getItem(AbstractAuthentication.STORAGE_KEY);

		return data && data.length ? JSON.parse(data) : {};
	}
}

