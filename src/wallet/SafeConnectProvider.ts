import {Messaging, ResponseInterfaceBase} from "../core/messaging";
import {uint8tohex} from "@tokenscript/attestation/dist/libs/utils";
import {KeyStore} from "../client/auth/util/KeyStore";
import {AbstractAuthentication, AuthenticationResult} from "../client/auth/abstractAuthentication";
import {AttestedAddress} from "../client/auth/attestedAddress";
import {UNInterface} from "../client/auth/util/UN";
import {SafeConnectChallenge} from "../client/auth/safeConnectChallenge";

export enum SafeConnectAction {
	CONNECT = "connect",
	SIGN_UN = "sign_un",
	NEW_CHALLENGE = "new_challenge"
}

export type ProofType = "address_attest" | "simple_challenge" | "nft_attest";

export interface SafeConnectOptions {
	url: string,
	initialProof: ProofType|false;
}

export class SafeConnectProvider {

	private messaging = new Messaging();
	private keyStore = new KeyStore();
	private readonly options: SafeConnectOptions;

	public static HOLDING_KEY_ALGORITHM = "RSASSA-PKCS1-v1_5";

	constructor(options: SafeConnectOptions) {
		this.options = options;
	}

	public async initSafeConnect(){

		let res: ResponseInterfaceBase = await this.messaging.sendMessage({
			action: SafeConnectAction.CONNECT,
			origin: this.options.url,
			timeout: 0,
			data: (await this.getInitialProofRequest())
		}, true);

		if (!this.options.initialProof)
			return res.data.address;

		let attest = res.data;

		this.processProofResult(attest);

		return attest.data?.address;
	}
	
	private processProofResult(attest: any){

		let proofModel: AbstractAuthentication;
		let proofData: AuthenticationResult;

		switch (this.options.initialProof){

		case "address_attest":

			proofModel = new AttestedAddress();

			proofData = {
				type: proofModel.TYPE,
				data: {
					attestation: attest.data.attestation
				},
				target: {
					address: attest.data.address
				}
			};

			proofModel.saveProof(attest.data.address, proofData);

			break;

		case "simple_challenge":

			proofModel = new SafeConnectChallenge();

			proofData = {
				type: proofModel.TYPE,
				data: attest.data,
				target: {
					address: attest.data.address
				}
			};

			break;
		}

		proofModel.saveProof(attest.data.address, proofData);
	}

	private async getInitialProofRequest(){

		let request: { type?: ProofType, subject?: string } = {};

		if (!this.options.initialProof)
			return;

		request.type = this.options.initialProof;

		if (this.options.initialProof !== "simple_challenge"){
			let holdingKey = await this.keyStore.getOrCreateKey(SafeConnectProvider.HOLDING_KEY_ALGORITHM);
			request.subject = uint8tohex(holdingKey.holdingPubKey)
		}

		return request;
	}

	public async signUNChallenge(un: UNInterface){

		let res: ResponseInterfaceBase = await this.messaging.sendMessage({
			action: SafeConnectAction.SIGN_UN,
			origin: this.options.url,
			timeout: 0,
			data: {
				un: encodeURIComponent(JSON.stringify(un))
			}
		}, true);

		console.log(res);

		return res.data.signature;
	}

	public async getLinkSigningKey(){
		let keys = await this.keyStore.getOrCreateKey(SafeConnectProvider.HOLDING_KEY_ALGORITHM);
		return keys.attestHoldingKey.privateKey;
	}

}