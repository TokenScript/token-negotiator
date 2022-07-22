import {AbstractAuthentication, AuthenticationMethod, AuthenticationResult} from "./abstractAuthentication";
import {AuthenticateInterface, OffChainTokenConfig, OnChainTokenConfig} from "../interface";
import Web3WalletProvider from "../../wallet/Web3WalletProvider";
import {SafeConnectProvider} from "../../wallet/SafeConnectProvider";
import {UN, UNInterface} from "./util/UN";

export class SignedUNChallenge extends AbstractAuthentication implements AuthenticationMethod {

	TYPE = "signedUN";
	private static DEFAULT_ENDPOINT = "https://crypto-verify.herokuapp.com/use-devcon-ticket";

	async getTokenProof(_issuerConfig: OnChainTokenConfig | OffChainTokenConfig, _tokens: Array<any>, request: AuthenticateInterface): Promise<AuthenticationResult> {

		let web3WalletProvider = await this.client.getWalletProvider();

		if (web3WalletProvider.getConnectedWalletData().length === 0){
			throw new Error("WALLET_REQUIRED");
		}

		let address = web3WalletProvider.getConnectedWalletData()[0].address;

		let currentProof: AuthenticationResult|null = this.getSavedProof(address);

		if (currentProof) {
			let unChallenge = currentProof?.data as UNInterface;

			if (unChallenge.expiration < Date.now() ||
				UN.recoverAddress(unChallenge) !== address.toLowerCase()) {

				this.deleteProof(address);
				currentProof = null;
			}
		}

		if (!currentProof){

			let walletConnection = web3WalletProvider.getConnectedWalletData()[0].provider;

			currentProof = {
				type: this.TYPE,
				data: {},
				target: {
					address: address
				}
			};

			let endpoint = request.options?.unEndpoint ?? SignedUNChallenge.DEFAULT_ENDPOINT;

			const challenge = await UN.getNewUN(endpoint);
			let signature;

			if (walletConnection instanceof SafeConnectProvider){

				signature = await walletConnection.signUNChallenge(challenge);

			} else {

				signature = await web3WalletProvider.signWith(
					challenge.messageToSign,
					walletConnection
				);
			}

			// Check that recovered address matches the signature of the requested address
			challenge.signature = signature;
			let recoveredAddr = UN.recoverAddress(challenge);

			if (recoveredAddr !== address.toLowerCase()){
				throw new Error("Address signature is invalid");
			}

			challenge.address = recoveredAddr;

			currentProof.data = challenge;

			this.saveProof(address, currentProof);
		}

		return currentProof;
	}

}