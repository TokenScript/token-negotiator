import {AbstractAuthentication, AuthenticationMethod, AuthenticationResult} from "./abstractAuthentication";
import {AuthenticateInterface, OffChainTokenConfig, OnChainTokenConfig} from "../interface";
import {EthereumKeyLinkingAttestation} from "@tokenscript/attestation/dist/safe-connect/EthereumKeyLinkingAttestation";

export class AttestedAddress extends AbstractAuthentication implements AuthenticationMethod {

	TYPE = "attestedAddress";

	async getTokenProof(issuerConfig: OnChainTokenConfig | OffChainTokenConfig, _tokens: Array<any>, request: AuthenticateInterface): Promise<AuthenticationResult> {

		let web3WalletProvider = await this.client.getWalletProvider();

		if (!web3WalletProvider.safeConnectAvailable())
			throw new Error("Safe connect is not available");

		if (!issuerConfig.onChain)
			throw new Error(this.TYPE + " is not available for off-chain tokens.");

		if (!request.options?.address)
			throw new Error("Address attestation requires a secondary address.");

		let address = web3WalletProvider.getConnectedWalletData()[0].address;

		let currentProof: AuthenticationResult|null = this.getSavedProof(address);

		if (currentProof.data.expiry < Date.now()) {
			this.deleteProof(address);
			currentProof = null;
		}

		let safeConnect = await web3WalletProvider.getSafeConnectProvider();

		if (!currentProof){

			// This will request and save a new challenge from safe connect
			await safeConnect.initSafeConnect();
			currentProof = this.getSavedProof(address);

			if (!currentProof)
				throw new Error("Could not get address attestation from safe connect");
		}

		let addrAttest = currentProof.data.attestation;

		currentProof.data.attestation = await AttestedAddress.createAndSignLinkAttestation(addrAttest, request.options.address, await safeConnect.getLinkSigningKey());

		return currentProof;
	}

	private static async createAndSignLinkAttestation(addressAttest: string, linkedEthAddress: string, holdingPrivKey: CryptoKey){

		const linkAttest = new EthereumKeyLinkingAttestation();

		linkAttest.create(addressAttest, linkedEthAddress, 3600);

		await linkAttest.sign(holdingPrivKey);

		return linkAttest.getBase64();
	}

}