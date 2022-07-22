import {AbstractAuthentication, AuthenticationMethod, AuthenticationResult} from "./abstractAuthentication";
import {AuthenticateInterface, OffChainTokenConfig, OnChainTokenConfig} from "../interface";
import Web3WalletProvider from "../../wallet/Web3WalletProvider";
import {SafeConnectProvider} from "../../wallet/SafeConnectProvider";

/**
 * @deprecated
 */
export class SafeConnectChallenge extends AbstractAuthentication implements AuthenticationMethod {

	TYPE = "scChallenge";

	async getTokenProof(issuerConfig: OnChainTokenConfig | OffChainTokenConfig, _tokens: Array<any>, _request: AuthenticateInterface): Promise<AuthenticationResult> {

		let web3WalletProvider = await this.client.getWalletProvider();

		if (!web3WalletProvider.safeConnectAvailable())
			throw new Error("Safe connect is not available");

		if (!issuerConfig.onChain)
			throw new Error(this.TYPE + " is not available for off-chain tokens.");

		let address = web3WalletProvider.getConnectedWalletData()[0].address;

		let currentProof: AuthenticationResult|null = this.getSavedProof(address);

		if (currentProof.data.expiry < Date.now()) {

			this.deleteProof(address);
			currentProof = null;
		}

		let safeConnect = await web3WalletProvider.getSafeConnectProvider();

		if (!currentProof){

			let walletConnection = web3WalletProvider.getConnectedWalletData()[0].provider;

			if (walletConnection instanceof SafeConnectProvider){

				// This will request and save a new challenge from safe connect
				await safeConnect.initSafeConnect();
				currentProof = this.getSavedProof(address);

				if (!currentProof)
					throw new Error("Could not get proof from safe connect");

			} else {

				throw new Error("Only safe connect supports this authentication type at this time");
			}
		}

		return currentProof;
	}

}