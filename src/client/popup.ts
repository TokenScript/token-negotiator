import {Start} from './views/start';

import {requiredParams} from "../utils";
import {Client} from "./index";
import {ViewInterface, ViewConstructor, AbstractView} from "./views/view-interface";
import {SelectIssuers} from "./views/select-issuers";

export interface PopupOptionsInterface {
    openingHeading?: string,
    issuerHeading?: string,
    repeatAction?: string,
    theme?: string,
    position?: string
}

export class Popup {

	options?: PopupOptionsInterface
	client: Client;
	popupContainer: any;
	viewContainer: any;
	loadContainer: any;
	currentView: ViewInterface|undefined;

	constructor(options: PopupOptionsInterface, client: Client) {
		this.options = options;
		this.client = client;
	}

	initialize(){

		this.popupContainer = document.querySelector(".overlay-tn");

		requiredParams(this.popupContainer, 'No entry point element with the class name of .overlay-tn found.');

		if (this.popupContainer) {

			this.popupContainer.innerHTML = `
                <div class="overlay-content-tn">
                    <div class="load-container-tn" style="display: none;">
                        <div class="lds-ellipsis loader-tn"><div></div><div></div><div></div><div></div></div>
                        <div class="loader-msg-tn"></div>
                        <button class="dismiss-error-tn btn-tn">Dismiss</button>
                    </div>
                    <div class="view-content-tn"></div>
                </div>
                <button aria-label="token negotiator toggle" class="overlay-fab-button-tn">
                  <svg style="pointer-events: none" xmlns="http://www.w3.org/2000/svg" width="55" height="55" viewBox="0 0 55 55"><path fill="white" id="svg-tn-left" d="M25.5 26h-5c0-2.9-0.6-5.6-1.7-8.1c-1-2.3-2.4-4.3-4.2-6.1c-1.9-1.9-4.3-3.4-6.8-4.4c-2.3-0.9-4.8-1.4-7.3-1.4v-5h7h18v6.2v5.6v6.2Z" transform="translate(13,28.5) translate(0,0) translate(-13,-13.5)"/><path id="svg-tn-right" fill="white" d="M53 1v11.9v6.1v7h-12.8h-6.1h-6.1v-13.4v-5.2v-6.4h12.6h5.3Z" transform="translate(41.5,28.7) translate(0,0) translate(-40.5,-13.5)"/></svg>
                </button>
            `;

			this.popupContainer.querySelector('.overlay-fab-button-tn').addEventListener('click', this.togglePopup.bind(this));

			this.popupContainer.addEventListener('click', (event: Event) => {
				event.stopPropagation();
			});

			document.addEventListener('click', () => {
				this.closeOverlay();
			});

			this.assignFabButtonAnimation();

			this.addTheme();

			this.viewContainer = this.popupContainer.querySelector(".view-content-tn");
			this.loadContainer = this.popupContainer.querySelector(".load-container-tn");

			this.loadContainer.querySelector('.dismiss-error-tn').addEventListener('click', this.dismissLoader.bind(this));

			if (this.client.web3WalletProvider.getConnectedWalletCount()){
				this.updatePopup(SelectIssuers)
			} else {
				this.updatePopup(Start);
			}

		}
	}

	closeOverlay() {

		this.popupContainer.classList.remove("open");

		window.KeyshapeJS.timelines()[0].time(0);

		window.KeyshapeJS.globalPause();
	}

	openOverlay(){

		this.popupContainer.classList.add("open");

		window.KeyshapeJS.timelines()[0].time(0);

		window.KeyshapeJS.globalPlay();
	}

	togglePopup() {

		requiredParams(this.popupContainer, 'No overlay element found.');

		let openOverlay = !this.popupContainer.classList.contains("open");

		if (openOverlay) {
			this.openOverlay();
		} else {
			this.closeOverlay();
		}
	}

	updatePopup(ViewClass: ViewConstructor<AbstractView>, data?: any) {

		if (!this.viewContainer){
			console.log("Element .overlay-content-tn not found: popup not initialized");
			return;
		}

		this.currentView = new ViewClass(this.client, this, this.viewContainer, {options: this.options, data: data});
		this.currentView.render();

	}

	showError(...message: string[]){

		this.loadContainer.querySelector('.loader-tn').style.display = 'none';
		this.loadContainer.querySelector('.dismiss-error-tn').style.display = 'block';

		this.loadContainer.querySelector('.loader-msg-tn').innerHTML = message.join("\n");

		this.loadContainer.style.display = 'flex';
	}

	showLoader(...message: string[]){

		this.loadContainer.querySelector('.loader-tn').style.display = 'block';
		this.loadContainer.querySelector('.dismiss-error-tn').style.display = 'none';

		this.loadContainer.querySelector('.loader-msg-tn').innerHTML = message.join("\n");

		this.loadContainer.style.display = 'flex';
	}

	dismissLoader(){
		this.loadContainer.style.display = 'none';
	}

	private addTheme() {

		let refTokenSelector = document.querySelector(".overlay-tn");

		if (refTokenSelector)
			refTokenSelector.classList.add((this.options?.theme ?? 'light'));

	}

	private assignFabButtonAnimation() {

		if (window.KeyshapeJS) {

			window.KeyshapeJS.globalPause();

			window.KeyshapeJS.animate("#svg-tn-left", [{ p: 'mpath', t: [0, 400], v: ['0%', '100%'], e: [[1, 0, 0, .6, 1], [0]], mp: "M13,28.5L27.1,28.1" }, { p: 'rotate', t: [0, 400], v: [0, 0], e: [[1, 0, 0, .6, 1], [0]] }, { p: 'scaleX', t: [0, 400], v: [1, 1], e: [[1, 0, 0, .6, 1], [0]] }, { p: 'scaleY', t: [0, 400], v: [1, 1], e: [[1, 0, 0, .6, 1], [0]] }, { p: 'anchorX', t: [0, 400], v: [-13, -17.1], e: [[1, 0, 0, .6, 1], [0]] }, { p: 'anchorY', t: [0, 400], v: [-13.5, -17.1], e: [[1, 0, 0, .6, 1], [0]] }, { p: 'd', t: [0, 400], v: ["path('M25.5,26C25.5,26,20.5,26,20.5,26C20.5,23.1,19.9,20.4,18.8,17.9C17.8,15.6,16.4,13.6,14.6,11.8C12.7,9.9,10.3,8.4,7.8,7.4C5.5,6.5,3,6,.5,6L.5,1C.5,1,.5,1,.5,1C.5,1,7.5,1,7.5,1L25.5,1L25.5,7.2C25.5,7.2,25.5,12.8,25.5,12.8C25.5,12.8,25.5,19,25.5,19Z')", "path('M31.8,32.8C31.5,33.2,30.9,33.4,30.4,33.4C29.9,33.4,29.4,33.2,29,32.8C29,32.8,1.4,5.2,1.4,5.2C1,4.8,.8,4.3,.8,3.8C.8,3.3,1,2.8,1.4,2.4L2.4,1.4C2.7,1,3.3,.8,3.8,.8C4.3,.8,4.8,1,5.2,1.4L5.2,1.4L32.8,29C33.2,29.4,33.4,29.9,33.4,30.4C33.4,30.9,33.2,31.5,32.8,31.8Z')"], e: [[1, 0, 0, .6, 1], [0]] }], "#svg-tn-right", [{ p: 'mpath', t: [0, 400], v: ['0%', '100%'], e: [[1, 0, 0, .6, 1], [0]], mp: "M41.5,28.7L27.1,28.1" }, { p: 'rotate', t: [0, 400], v: [0, 0], e: [[1, 0, 0, .6, 1], [0]] }, { p: 'anchorX', t: [0, 400], v: [-40.5, -17.1], e: [[1, 0, 0, .6, 1], [0]] }, { p: 'anchorY', t: [0, 400], v: [-13.5, -17.1], e: [[1, 0, 0, .6, 1], [0]] }, { p: 'd', t: [0, 400], v: ["path('M53,1C53,1,53,1,53,1C53,1,53,12.9,53,12.9L53,19C53,19,53,26,53,26C53,26,40.2,26,40.2,26L34.1,26C34.1,26,28,26,28,26C28,26,28,12.6,28,12.6L28,7.4C28,7.4,28,1,28,1C28,1,40.6,1,40.6,1C40.6,1,45.9,1,45.9,1Z')", "path('M29,1.4C29.4,1,29.9,.8,30.4,.8C30.9,.8,31.5,1,31.8,1.4L32.8,2.4C33.2,2.7,33.4,3.3,33.4,3.8C33.4,4.3,33.2,4.8,32.8,5.2L5.2,32.8C4.8,33.2,4.3,33.4,3.8,33.4C3.3,33.4,2.8,33.2,2.4,32.8L1.4,31.8C1,31.5,.8,30.9,.8,30.4C.8,29.9,1,29.4,1.4,29C1.4,29,29,1.4,29,1.4Z')"], e: [[1, 0, 0, .6, 1], [0]] }], { autoremove: false }).range(0, 400);

		}

	}
}