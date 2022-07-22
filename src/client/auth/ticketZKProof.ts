import {AbstractAuthentication, AuthenticationMethod, AuthenticationResult} from "./abstractAuthentication";
import {AuthenticateInterface, OffChainTokenConfig, OnChainTokenConfig} from "../interface";
import {OutletAction, Messaging} from "../messaging";
import {Authenticator} from "@tokenscript/attestation";
import {SignedUNChallenge} from "./signedUNChallenge";
import {UNInterface} from "./util/UN";

export class TicketZKProof extends AbstractAuthentication implements AuthenticationMethod {

	TYPE = "ticketZKProof";

	private messaging = new Messaging();

	async getTokenProof(issuerConfig: OnChainTokenConfig | OffChainTokenConfig, tokens: Array<any>, request: AuthenticateInterface): Promise<AuthenticationResult> {

		if (issuerConfig.onChain === true)
			throw new Error(this.TYPE + " is not available for off-chain tokens.");

		let useEthKey: UNInterface|null = null;

		if (issuerConfig.unEndPoint) {
			let unChallenge = new SignedUNChallenge(this.client);
			request.options = {
				...request.options,
				unEndPoint: issuerConfig.unEndPoint
			};
			let unRes = await unChallenge.getTokenProof(issuerConfig, tokens, request);
			useEthKey = unRes.data as UNInterface;
		}

		console.log("Sending attestation.id");

		let res = await this.messaging.sendMessage({
			action: OutletAction.GET_PROOF,
			origin: issuerConfig.tokenOrigin,
			timeout: 0, // Don't time out on this event as it needs active input from the user
			data: {
				issuer: issuerConfig.collectionID,
				token: tokens[0],
				address: request.address ? request.address : "",
				wallet: request.wallet ? request.wallet : ""
			}
		}, request.options.messagingForceTab, this.client.getUi());

		if (!res.data.proof)
			throw new Error("Failed to get proof from the outlet.");

		let proof: AuthenticationResult = {
			type: this.TYPE,
			data: res.data,
			target: {
				tokens: []
			}
		};

		if (useEthKey) {
			Authenticator.validateUseTicket(
				res.data.proof,
				issuerConfig.base64attestorPubKey,
				issuerConfig.base64senderPublicKeys,
				useEthKey.address ?? ""
			);

			proof.data.useEthKey = useEthKey;
		}

		return proof;
	}

}