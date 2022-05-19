import {
	base64ToUint8array,
	requiredParams,
	compareObjects,
} from "../utils/index";
// @ts-ignore
import { ethers } from "ethers";

interface FilterInterface {
  [key: string]: any;
}

export const filterTokens = (
	decodedTokens: any,
	filter: FilterInterface = []
) => {
	let res: any = [];

	if (
		decodedTokens.length &&
    typeof filter === "object" &&
    Object.keys(filter).length
	) {
		let filterKeys = Object.keys(filter);

		decodedTokens.forEach((token: any) => {
			let fitFilter = 1;

			filterKeys.forEach((key) => {
				if (token[key] && token[key].toString() !== filter[key].toString())
					fitFilter = 0;
			});

			if (fitFilter) res.push(token);
		});

		return res;
	} else {
		return decodedTokens;
	}
};

export const readTokens = (itemStorageKey: any) => {
	const storageTickets = localStorage.getItem(itemStorageKey);

	let tokens: any = [];

	let output: any = { tokens: [], noTokens: true, success: true };

	try {
		if (storageTickets && storageTickets.length) {
			tokens = JSON.parse(storageTickets);

			if (tokens.length !== 0) {
				tokens.forEach((item: any) => {
					if (item.token && item.secret) output.tokens.push(item);
				});
			}

			if (output.tokens.length) {
				output.noTokens = false;
			}
		}
	} catch (e) {
		output.success = false;
	}

	return output;
};

export const decodeTokens = (
	rawTokens: any,
	tokenParser: any,
	unsignedTokenDataName: string
) => {
	const x = JSON.parse(rawTokens);

	if (x.length) {
		return x.map((tokenData: any) => {
			if (tokenData.token) {
				let decodedToken = new tokenParser(
					base64ToUint8array(tokenData.token).buffer
				);

				if (decodedToken && decodedToken[unsignedTokenDataName]){
					let token = decodedToken[unsignedTokenDataName];
					
					return propsArrayBufferToArray(token);
				}
			}
		});
	} else {
		return [];
	}
};

function propsArrayBufferToArray(obj: any){
	Object.keys(obj).forEach(key => {
		if (obj[key] instanceof ArrayBuffer){
			obj[key] = Array.from( new Uint8Array(obj[key]) );
		}
	});
	return obj;
}

export const storeMagicURL = (tokens: any, itemStorageKey: string) => {
	if (tokens) {
		localStorage.setItem(itemStorageKey, JSON.stringify(tokens));
	}
};

export const readMagicUrl = (
	tokenUrlName: string,
	tokenSecretName: string,
	tokenIdName: string,
	itemStorageKey: string,
	urlParams: URLSearchParams | null = null
) => {
	if (urlParams === null)
		urlParams = new URLSearchParams(window.location.search);

	const tokenFromQuery = urlParams.get(tokenUrlName);

	const secretFromQuery = urlParams.get(tokenSecretName);

	const idFromQuery = urlParams.get(tokenIdName);

	if (!(tokenFromQuery && secretFromQuery))
		throw new Error("Incomplete token params in URL.");

	let tokensOutput = readTokens(itemStorageKey);

	let isNewQueryTicket = true;

	// TODO: use loop here instead
	let tokens = tokensOutput.tokens.map((tokenData: any) => {
		if (tokenData.token === tokenFromQuery) {
			isNewQueryTicket = false;
		}

		return tokenData;
	});

	if (isNewQueryTicket) {
		tokens.push({
			token: tokenFromQuery,
			secret: secretFromQuery,
			id: idFromQuery,
			magic_link: window.location.href,
		});
		return tokens;
	}

	throw new Error("Token already added.");
};

export const ethKeyIsValid = (ethKey: any) => {
	return ethKey.expiry >= Date.now();
};

export const validateUseEthKey = async (endPoint: string, data: any) => {
	try {
		const response = await fetch(endPoint, {
			method: "POST",
			cache: "no-cache",
			headers: { "Content-Type": "application/json" },
			redirect: "follow",
			referrerPolicy: "no-referrer",
			body: JSON.stringify(data),
		});

		const json = await response.json();

		return json.address;
	} catch (e) {
		return {
			success: false,
			message: "validate ethkey request failed",
		};
	}
};

export const getUnpredictableNumber = async (endPoint: string) => {
	try {
		const response = await fetch(endPoint);

		const json = await response.json();

		json.success = true;

		return json;
	} catch (e) {
		return {
			success: false,
			message: "UN request failed",
		};
	}
};

export const getChallengeSigned = async (
	tokenIssuer: any,
	web3WalletProvider: any
) => {
	const storageEthKeys = localStorage.getItem(tokenIssuer.ethKeyitemStorageKey);

	let ethKeys =
    storageEthKeys && storageEthKeys.length ? JSON.parse(storageEthKeys) : {};

	// try {

	let address = web3WalletProvider.getConnectedWallet().address;

	if (!address) {
		await web3WalletProvider.connect("MetaMask");

		address = web3WalletProvider.getConnectedWallet().address;
	}

	// if Passive Flow ( IF PASSIVE WORKS, REMOVE THIS CODE).
	// let address = await connectMetamaskAndGetAddress();

	address = address.toLowerCase();

	let useEthKey;

	if (ethKeys && ethKeys[address] && !ethKeyIsValid(ethKeys[address])) {
		delete ethKeys[address];
	}

	if (ethKeys && ethKeys[address]) {
		useEthKey = ethKeys[address];
	} else {
		useEthKey = await signNewChallenge(
			tokenIssuer.unEndPoint,
			web3WalletProvider
		);

		if (useEthKey) {
			ethKeys[useEthKey.address.toLowerCase()] = useEthKey;

			localStorage.setItem(
				tokenIssuer.ethKeyitemStorageKey,
				JSON.stringify(ethKeys)
			);
		}
	}

	return useEthKey;

	// } catch (e: any) {

	// throw new Error(e);

	// }
}

export const connectMetamaskAndGetAddress = async () => {
	requiredParams(window.ethereum, "Please install metamask to continue.");

	const userAddresses = await window.ethereum.request({
		method: "eth_requestAccounts",
	});

	if (!userAddresses || !userAddresses.length)
		throw new Error("Active Wallet required");

	return userAddresses[0];
};

export const signNewChallenge = async (
	unEndPoint: string,
	web3WalletProvider: any
) => {
	console.log("sign new challenge");

	let res = await getUnpredictableNumber(unEndPoint);

	const {
		number: UN,
		randomness,
		domain,
		expiration: expiry,
		messageToSign,
	} = res;

	let signature = await signMessageWithBrowserWallet(
		messageToSign,
		web3WalletProvider
	);

	const msgHash = ethers.utils.hashMessage(messageToSign);

	const msgHashBytes = ethers.utils.arrayify(msgHash);

	const recoveredAddress = ethers.utils.recoverAddress(msgHashBytes, signature);

	return {
		address: recoveredAddress,
		expiry,
		domain,
		randomness,
		signature,
		UN,
	};
};

export const signMessageWithBrowserWallet = async (
	message: any,
	web3WalletProvider: any
) => {
	// For testing paste this into the console.
	// window.negotiator.authenticate({
	//   issuer: "devcon",
	//   unsignedToken: {
	//     devconId: "6", ticketClass: 0, ticketId: "417541561854"
	//   }});

	return await web3WalletProvider.signWith(
		message,
		web3WalletProvider.getConnectedWallet()
	);
};

export const rawTokenCheck = async (unsignedToken: any, tokenIssuer: any) => {
	// currently meta mask is needed to move beyond this point.
	// however the err msg given is not obvious that this is the issue.

	// metamask is only one of the wallets, we have to use walletConnect to
	// check if user have some wallet immediately before use wallet 
	// requiredParams(window.ethereum, "Please install metamask to continue.");

	let rawTokenData = getRawToken(unsignedToken, tokenIssuer);

	if (!rawTokenData) return null;

	// @ts-ignore
	let base64ticket = rawTokenData.token;

	// @ts-ignore
	let ticketSecret = rawTokenData.secret;

	let tokenObj = {
		ticketBlob: base64ticket,
		ticketSecret: ticketSecret,
		attestationOrigin: tokenIssuer.attestationOrigin,
	};

	// @ts-ignore
	if (rawTokenData && rawTokenData.id) tokenObj.email = rawTokenData.id;

	// @ts-ignore
	if (rawTokenData && rawTokenData.magic_link){
		// @ts-ignore
		tokenObj.magicLink = rawTokenData.magic_link;
	}

	return tokenObj;
};

export const getRawToken = (unsignedToken: any, tokenIssuer: any) => {
	if (!unsignedToken || !Object.keys(unsignedToken).length) return;

	let tokensOutput = readTokens(tokenIssuer.itemStorageKey);

	if (tokensOutput.success && !tokensOutput.noTokens) {
		let rawTokens = tokensOutput.tokens;

		let token = {};

		if (rawTokens.length) {
			rawTokens.forEach((tokenData: any) => {
				if (tokenData.token) {
					const _tokenParser = tokenIssuer.tokenParser;

					let decodedToken = new _tokenParser(
						base64ToUint8array(tokenData.token).buffer
					);

					if (decodedToken && decodedToken[tokenIssuer.unsignedTokenDataName]) {
						let decodedTokenData = decodedToken[tokenIssuer.unsignedTokenDataName];
						decodedTokenData = propsArrayBufferToArray(decodedTokenData);

						if (compareObjects(decodedTokenData, unsignedToken)) {
							token = tokenData;
						}
					}
				}
			});
		}
		
		return token;
	} else {
		return null;
	}
};
