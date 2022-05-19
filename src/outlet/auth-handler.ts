// @ts-nocheck

import {Item} from '../tokenLookup'
import {MessageResponseAction} from '../client/messaging'
import {Outlet} from "./index";
import {Authenticator} from '@tokenscript/attestation'

export interface DevconToken {
    ticketBlob: string,
    ticketSecret: bigint,
    email?: string,
    magicLink?: string,
    attestationOrigin: string,
}

interface PostMessageData {
    force?: boolean,
    email?: string,
    magicLink?: string,
}

export class AuthHandler {

	private outlet: Outlet;
	private evtid: any;

	private signedTokenBlob: string|undefined;
	private magicLink: string|undefined;
	private email: string|undefined;
	private signedTokenSecret: bigint|undefined;
	private attestationOrigin: string|undefined;

	private iframe: HTMLIFrameElement|null = null;
	private iframeWrap: HTMLElement|null = null;

	private attestationBlob: string|null = null;
	private attestationSecret: bigint|null = null;

	private base64attestorPubKey: string|undefined;
	private base64senderPublicKeys: {[key: string]: string};

	constructor(outlet: Outlet, evtid: any, tokenDef: Item, tokenObj: DevconToken|any) {
		this.outlet = outlet;
		this.evtid = evtid;
		this.base64senderPublicKeys = tokenDef.base64senderPublicKeys;
		this.base64attestorPubKey = tokenDef.base64attestorPubKey;

		this.signedTokenBlob = tokenObj.ticketBlob;
		this.magicLink = tokenObj.magicLink;
		this.email = tokenObj.email;
		this.signedTokenSecret = tokenObj.ticketSecret;
		this.attestationOrigin = tokenObj.attestationOrigin;
	}

	// TODO: combine functionality with messaging to enable tab support? Changes required in attestation.id code
	public authenticate(){

		return new Promise((resolve, reject) => {

			if (!this.attestationOrigin)
				return reject("Attestation origin is null");

			window.addEventListener("message", (e) => {

				if (!this.attestationOrigin)
					return;

				let attestURL = new URL(this.attestationOrigin);

				if (e.origin !== attestURL.origin) {
					return;
				}

				if (!this.iframe || !this.iframeWrap || !this.iframe.contentWindow)
					return;

				this.postMessageAttestationListener(e, resolve, reject);
			});

			this.createIframe();

		});

	}

	private createIframe(){

		const iframe = document.createElement('iframe');
		iframe.setAttribute('allow',"clipboard-read");
		this.iframe = iframe;

		iframe.src = this.attestationOrigin ?? "";
		iframe.style.width = '800px';
		iframe.style.height = '700px';
		iframe.style.maxWidth = '100%';
		iframe.style.background = '#fff';

		let iframeWrap = document.createElement('div');
		this.iframeWrap = iframeWrap;
		iframeWrap.setAttribute('style', 'width:100%;min-height: 100vh; position: fixed; align-items: center; justify-content: center;display: none;top: 0; left: 0; background: #fffa');
		iframeWrap.appendChild(iframe);
        
		document.body.appendChild(iframeWrap);
	}

	async postMessageAttestationListener(event: MessageEvent, resolve: Function, reject: Function){

		console.log('postMessageAttestationListener event (Authenticator)',event.data);

		if (
			typeof event.data.ready !== "undefined"
            && event.data.ready === true
		) {
			let sendData: PostMessageData = {force: false};
			// We will not use magicLink attestation anymore 
			// because of lower security level
			//
			// if (this.magicLink){
			//     sendData.magicLink = this.magicLink;

			//     if (sendData.magicLink.indexOf("#") > -1)
			//         sendData.magicLink = sendData.magicLink.replace("#", "?");
			// }
			if (this.email) sendData.email = this.email;

			this.iframe.contentWindow.postMessage(sendData, this.attestationOrigin);
			return;
		}


		if (
			typeof event.data.display !== "undefined"
		) {
			if (event.data.display === true) {

				this.iframeWrap.style.display = 'flex';
				// this.negotiator && this.negotiator.commandDisplayIframe();
                
				this.outlet.sendMessageResponse({
					evtid: this.evtid,
					evt: MessageResponseAction.SHOW_FRAME
				});
                
                
			} else {

				if (event.data.error){
					console.log("Error received from the iframe: " + event.data.error);
					reject(event.data.error);
				}

				this.iframeWrap.style.display = 'none';
				// this.negotiator && this.negotiator.commandHideIframe();

			}
		}
    
        
        if (!event.data?.attestation || !event.data?.requestSecret){
            return;
        }

        this.iframeWrap.remove();

		this.attestationBlob = event.data?.attestation;
		this.attestationSecret = event.data?.requestSecret;

		try {

			if (!this.signedTokenSecret ) {
				throw new Error("signedTokenSecret required")
			}
			if (!this.attestationSecret ) {
				throw new Error("attestationSecret required")
			}
			if (!this.signedTokenBlob ) {
				throw new Error("signedTokenBlob required")
			}
			if (!this.attestationBlob ) {
				throw new Error("attestationBlob required")
			}
			if (!this.base64attestorPubKey ) {
				throw new Error("base64attestorPubKey required")
			}
			if (!this.base64senderPublicKeys ) {
				throw new Error("base64senderPublicKeys required")
			}

			let useToken = await Authenticator.getUseTicket(
				this.signedTokenSecret,
				this.attestationSecret,
				this.signedTokenBlob ,
				this.attestationBlob ,
				this.base64attestorPubKey,
				this.base64senderPublicKeys
			);
            
			if (useToken){
				console.log('this.authResultCallback( useToken ): ');
				resolve(useToken);
			} else {
				console.log('this.authResultCallback( empty ): ');
				reject(useToken);
			}

		} catch (e){
			console.log(`UseDevconTicket. Something went wrong. ${e}`);
			reject(e);
		}
		// construct UseDevconTicket, see
		// https://github.com/TokenScript/attestation/blob/main/data-modules/src/UseDevconTicket.asd

		// TODO we dont have ready UseDevconTicket constructor yet
		// let useDevconTicket = new UseDevconTicket({
		//     signedDevconTicket: signedDevonTicket,
		//     identifierAttestation: identifierAttestation,
		//     proof: proof
		// })
		// // Serialise it (for use as a transaction parameter) and return it
		// return useDevconTicket.serialize();
	}
}