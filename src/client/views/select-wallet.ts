import {AbstractView} from "./view-interface";
import {SelectIssuers} from "./select-issuers";
import { logger } from "../../utils";

const metaMaskSVG = '<svg width="62px" version="1.1" id="Layer_1" xmlns:ev="http://www.w3.org/2001/xml-events"xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 318.6 318.6"style="enable-background:new 0 0 318.6 318.6;" xml:space="preserve"><style type="text/css">.st0{fill:#E2761B;stroke:#E2761B;stroke-linecap:round;stroke-linejoin:round;}.st1{fill:#E4761B;stroke:#E4761B;stroke-linecap:round;stroke-linejoin:round;}.st2{fill:#D7C1B3;stroke:#D7C1B3;stroke-linecap:round;stroke-linejoin:round;}.st3{fill:#233447;stroke:#233447;stroke-linecap:round;stroke-linejoin:round;}.st4{fill:#CD6116;stroke:#CD6116;stroke-linecap:round;stroke-linejoin:round;}.st5{fill:#E4751F;stroke:#E4751F;stroke-linecap:round;stroke-linejoin:round;}.st6{fill:#F6851B;stroke:#F6851B;stroke-linecap:round;stroke-linejoin:round;}.st7{fill:#C0AD9E;stroke:#C0AD9E;stroke-linecap:round;stroke-linejoin:round;}.st8{fill:#161616;stroke:#161616;stroke-linecap:round;stroke-linejoin:round;}.st9{fill:#763D16;stroke:#763D16;stroke-linecap:round;stroke-linejoin:round;}</style><polygon class="st0" points="274.1,35.5 174.6,109.4 193,65.8 "/><g><polygon class="st1" points="44.4,35.5 143.1,110.1 125.6,65.8 	"/><polygon class="st1" points="238.3,206.8 211.8,247.4 268.5,263 284.8,207.7 	"/><polygon class="st1" points="33.9,207.7 50.1,263 106.8,247.4 80.3,206.8 	"/><polygon class="st1" points="103.6,138.2 87.8,162.1 144.1,164.6 142.1,104.1 	"/><polygon class="st1" points="214.9,138.2 175.9,103.4 174.6,164.6 230.8,162.1 	"/><polygon class="st1" points="106.8,247.4 140.6,230.9 111.4,208.1 	"/><polygon class="st1" points="177.9,230.9 211.8,247.4 207.1,208.1 	"/></g><g><polygon class="st2" points="211.8,247.4 177.9,230.9 180.6,253 180.3,262.3 	"/><polygon class="st2" points="106.8,247.4 138.3,262.3 138.1,253 140.6,230.9 	"/></g><polygon class="st3" points="138.8,193.5 110.6,185.2 130.5,176.1 "/><polygon class="st3" points="179.7,193.5 188,176.1 208,185.2 "/><g><polygon class="st4" points="106.8,247.4 111.6,206.8 80.3,207.7 	"/><polygon class="st4" points="207,206.8 211.8,247.4 238.3,207.7 	"/><polygon class="st4" points="230.8,162.1 174.6,164.6 179.8,193.5 188.1,176.1 208.1,185.2 	"/><polygon class="st4" points="110.6,185.2 130.6,176.1 138.8,193.5 144.1,164.6 87.8,162.1 	"/></g><g><polygon class="st5" points="87.8,162.1 111.4,208.1 110.6,185.2 	"/><polygon class="st5" points="208.1,185.2 207.1,208.1 230.8,162.1 	"/><polygon class="st5" points="144.1,164.6 138.8,193.5 145.4,227.6 146.9,182.7 	"/><polygon class="st5" points="174.6,164.6 171.9,182.6 173.1,227.6 179.8,193.5 	"/></g><polygon class="st6" points="179.8,193.5 173.1,227.6 177.9,230.9 207.1,208.1 208.1,185.2 "/><polygon class="st6" points="110.6,185.2 111.4,208.1 140.6,230.9 145.4,227.6 138.8,193.5 "/><polygon class="st7" points="180.3,262.3 180.6,253 178.1,250.8 140.4,250.8 138.1,253 138.3,262.3 106.8,247.4 117.8,256.4 140.1,271.9 178.4,271.9 200.8,256.4 211.8,247.4 "/><polygon class="st8" points="177.9,230.9 173.1,227.6 145.4,227.6 140.6,230.9 138.1,253 140.4,250.8 178.1,250.8 180.6,253 "/><g><polygon class="st9" points="278.3,114.2 286.8,73.4 274.1,35.5 177.9,106.9 214.9,138.2 267.2,153.5 278.8,140 273.8,136.4 281.8,129.1 275.6,124.3 283.6,118.2 	"/><polygon class="st9" points="31.8,73.4 40.3,114.2 34.9,118.2 42.9,124.3 36.8,129.1 44.8,136.4 39.8,140 51.3,153.5 103.6,138.2 140.6,106.9 44.4,35.5 	"/></g><polygon class="st6" points="267.2,153.5 214.9,138.2 230.8,162.1 207.1,208.1 238.3,207.7 284.8,207.7 "/><polygon class="st6" points="103.6,138.2 51.3,153.5 33.9,207.7 80.3,207.7 111.4,208.1 87.8,162.1 "/><polygon class="st6" points="174.6,164.6 177.9,106.9 193.1,65.8 125.6,65.8 140.6,106.9 144.1,164.6 145.3,182.8 145.4,227.6 173.1,227.6 173.3,182.8 "/></svg>';
const walletConnectSVG = '<svg width="62px" height="62px" viewBox="0 0 319 319" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><g transform="matrix(1.7268,0,0,1.7268,159.3,155.744)"><g transform="matrix(1,0,0,1,-107.5,-107.5)"><path d="M55.953,84.792L72.263,100.335C72.263,100.335 84.86,78.281 106.774,78.436C106.774,78.436 126.648,75.152 143.824,101.06L160.354,85.616C160.354,85.616 143.436,59.639 107.409,59.615C107.409,59.615 79.188,56.141 55.953,84.792Z" style="fill:rgb(59,153,252);"/><path d="M42.568,93.225L25.838,109.259L74.827,157.509L107.434,125.302L141.274,157.461L188.677,109.672L172.91,93.916L141.771,126.195L107.369,93.403L74.398,126.501L42.568,93.225Z" style="fill:rgb(59,153,252);"/></g></g></svg>';
const torusSVG = '<svg width="62px" height="62px" viewBox="0 0 319 319" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><g transform="matrix(1.9124,0,0,1.9124,159.3,159.3)"><g transform="matrix(1,0,0,1,-107.5,-107.5)"><path d="M57.267,51.007L56.757,84.626L85.505,85.297L85.565,164.593L119.635,164.873L119.472,51.399L57.267,51.007Z" style="fill:rgb(57,150,254);"/><g transform="matrix(1.06773,0,0,1.04155,-3.94432,-8.22515)"><circle cx="139.434" cy="73.102" r="16.365" style="fill:rgb(57,150,254);"/></g></g></g></svg>';
// const authereumSVG = '<svg width="62px" height="62px" viewBox="0 0 319 319" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><g transform="matrix(1.59847,0,0,1.59847,159.3,159.3)"><g transform="matrix(1,0,0,1,-107.5,-107.5)"><g transform="matrix(0.0313885,0,0,-0.0313885,14.0407,194.745)"><path d="M1910,4991C1621,4898 1312,4800 1223,4771L1060,4719L1060,3802C1060,3240 1064,2850 1070,2795C1115,2401 1280,2012 1538,1690C1580,1638 1652,1557 1699,1510C1779,1431 2968,400 2981,400C2987,400 4063,1326 4194,1443C4488,1709 4737,2121 4839,2511C4896,2732 4895,2714 4895,3759L4895,4724L4201,4942C3819,5062 3505,5158 3503,5156C3498,5152 3754,4654 3769,4638C3774,4632 3898,4592 4333,4455L4481,4409L4477,3617C4473,2750 4474,2774 4410,2554C4334,2292 4187,2044 3979,1827C3896,1741 2990,958 2978,962C2960,968 2081,1730 2005,1805C1782,2026 1610,2315 1540,2592C1486,2801 1487,2771 1483,3617L1479,4408L1527,4423C1831,4514 2168,4626 2182,4642C2191,4652 2242,4745 2296,4848C2349,4951 2408,5063 2427,5098C2450,5138 2457,5160 2448,5159C2441,5159 2199,5083 1910,4991Z" style="fill:rgb(255,76,47);fill-rule:nonzero;"/><path d="M2401,4082L1837,3005L1849,2906C1865,2780 1900,2659 1955,2542C2000,2447 2085,2310 2099,2310C2104,2310 2302,2683 2541,3139C2860,3750 2978,3965 2985,3956C2991,3948 3191,3577 3430,3131C3669,2685 3867,2320 3871,2320C3875,2320 3902,2357 3931,2403C4036,2565 4106,2772 4116,2945L4121,3035L3551,4095C3238,4677 2978,5155 2973,5157C2969,5158 2711,4675 2401,4082Z" style="fill:rgb(255,76,47);fill-rule:nonzero;"/><path d="M2693,2578C2540,2274 2414,2021 2413,2015C2411,2004 2545,1886 2818,1657L2982,1520L3043,1572C3077,1601 3202,1710 3320,1814C3438,1918 3537,2005 3540,2007C3546,2013 2987,3130 2978,3130C2973,3130 2845,2881 2693,2578Z" style="fill:rgb(255,76,47);fill-rule:nonzero;"/></g></g></g></svg>';
// const fortmaticSVG = '<svg width="62px" height="62px" viewBox="0 0 319 319" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><g transform="matrix(2.31323,0,0,2.3124,160.089,159.3)"><g transform="matrix(1,0,0,1,-107.5,-107.5)"><g><path d="M56.562,55.967L56.728,158.343L82.471,158.443L82.607,81.482L159.792,81.464L160.027,55.553L56.562,55.967Z" style="fill:rgb(104,81,255);"/><path d="M108.816,107.528L108.681,132.979L133.992,132.886L134.481,158.989C134.481,158.989 156.578,159.542 160.099,134.359L160.088,107.144L108.816,107.528Z" style="fill:rgb(104,81,255);"/></g></g></g></svg>';
// const portisSVG = '<svg width="62px" height="62px" viewBox="0 0 319 319" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><g transform="matrix(1.8657,0,0,1.8657,159.3,159.3)"><g transform="matrix(1,0,0,1,-107.5,-107.5)"><g transform="matrix(0.509593,0,0,0.509593,64.4687,40.2626)"><path d="M22.421,227.251C22.421,227.251 42.534,256.085 82.385,256.833C82.385,256.833 118.368,260.577 147.443,227.458C107.324,185.991 65.722,184.009 22.421,227.251Z" style="fill:rgb(82,155,186);"/><path d="M20.875,139.866L3.062,147.966L84.928,196.177C84.928,196.177 76.315,258.808 33.458,237.934C33.458,237.934 -8.655,209.535 3.062,147.966" style="fill:rgb(109,178,216);"/><g transform="matrix(-1,0,0,1,169.931,0)"><path d="M20.875,139.866L3.062,147.966L84.928,196.177C84.928,196.177 76.315,258.808 33.458,237.934C33.458,237.934 -8.655,209.535 3.062,147.966" style="fill:rgb(75,107,154);"/></g><path d="M6.322,130.662L84.765,1.012L84.854,96.05L6.322,130.662Z" style="fill:rgb(109,178,216);"/><g transform="matrix(1,0,0,1,-1,0)"><path d="M7.218,130.602L85.839,177.824L85.813,95.435L7.218,130.602Z" style="fill:rgb(62,85,120);"/></g><g transform="matrix(-1,0,0,1,169.314,0.108375)"><path d="M6.322,130.662L84.765,1.012L84.854,96.05L6.322,130.662Z" style="fill:rgb(75,107,154);"/></g><g transform="matrix(-1,0,0,1,170.314,0.108375)"><path d="M7.218,130.602L85.608,177.9L85.813,95.435L7.218,130.602Z" style="fill:rgb(29,66,89);"/></g><path d="M148.16,139.596L166.888,147.96L85.017,196.225L3.032,148.034L22.326,140.272L84.641,176.976L148.16,139.596Z" style="fill:rgb(19,52,68);"/></g></g></g></svg>';

export class SelectWallet extends AbstractView {

	render(){

		const MetaMaskButton = (typeof window.ethereum !== 'undefined') ?
			`<button class="wallet-button-tn" data-wallet="MetaMask">
                ${metaMaskSVG}
                <p>MetaMask</p>
            </button>` : '';

		const SafeConnectButton = this.client.safeConnectAvailable() ?
			`<button class="wallet-button-tn" data-wallet="SafeConnect">
			  <svg style="pointer-events: none" xmlns="http://www.w3.org/2000/svg" width="55" height="55" viewBox="0 0 55 55">
				<path fill="black" d="M25.5 26h-5c0-2.9-0.6-5.6-1.7-8.1c-1-2.3-2.4-4.3-4.2-6.1c-1.9-1.9-4.3-3.4-6.8-4.4c-2.3-0.9-4.8-1.4-7.3-1.4v-5h7h18v6.2v5.6v6.2Z" transform="translate(13,28.5) translate(0,0) translate(-13,-13.5)"/>
				<path fill="black" d="M53 1v11.9v6.1v7h-12.8h-6.1h-6.1v-13.4v-5.2v-6.4h12.6h5.3Z" transform="translate(41.5,28.7) translate(0,0) translate(-40.5,-13.5)"/></svg>
			  <p>Safe Connect</p>
			</button>` : '';

		this.viewContainer.innerHTML = `
            <div class="inner-content-tn scroll-tn">
              <div class="wallet-selection-view-tn">
                <div class="issuer-view-tn">
                  <div class="brand-tn"></div>
                  <div class="headline-container-tn">
                    <p style="text-align: center;">Select Wallet</p>
                  </div>
                  <div class="wallet-button-container-tn">
                  	${SafeConnectButton}
                    ${MetaMaskButton}
                    <button class="wallet-button-tn" data-wallet="WalletConnect">
                      ${walletConnectSVG}
                      <p>Wallet Connect</p>
                    </button>
                    <button class="wallet-button-tn" data-wallet="Torus">
                      ${torusSVG}
                      <p>Torus</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
        `;

		this.viewContainer.querySelectorAll('.wallet-button-tn').forEach((elem: any) => {
			elem.addEventListener('click', this.connectWallet.bind(this));
		});

		// TODO - Add to attestation.id to enable e2e support of additional Wallet Technologies.
		// <button class="wallet-button-tn" class="" onClick="negotiatorConnectToWallet('Fortmatic')">
		// ${fortmaticSVG}
		// <p>Fortmatic</p>
		// </button>
		// <button class="wallet-button-tn" class="" onClick="negotiatorConnectToWallet('Portis')">
		// ${portisSVG}
		// <p>Portis</p>
		// </button>
		// <button class="wallet-button-tn" class="" onClick="negotiatorConnectToWallet('Authereum')">
		// ${authereumSVG}
		// <p>Authereum</p>
		// </button>
	}

	async connectWallet(e: any){

		let wallet: any = e.currentTarget.dataset.wallet;

		logger(2, "Connect wallet: " + wallet);

		let timer = setTimeout(() => {
			this.ui.showLoader(
				"<h4>Connecting to " + wallet + "...</h4>",
				"<small>You may need to unlock your wallet to continue.</small>"
			);
		}, 500); // In case already authorized

		try {
			await this.client.negotiatorConnectToWallet(wallet);

			if (timer) clearTimeout(timer);
			this.ui.dismissLoader();

			if (this.params?.data?.connectCallback){
				this.params?.data?.connectCallback();
			} else {
				this.ui.updateUI(SelectIssuers);
			}

		} catch (err: any){
			if (timer) clearTimeout(timer);
			this.ui.showError(err);
			return;
		}
	}

}