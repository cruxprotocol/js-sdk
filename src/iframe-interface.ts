import { Encryption } from ".";
import config from "./config.json";

let postMessage = function(message) {
	message = JSON.stringify(message)
	this.contentWindow.postMessage(message, config.IFRAME_TARGET_DOMAIN)
}


let onload = function() {
	console.log('called onload!')
	let message = {type: 'register', encryptionKey: this.openPayOptions.encryptionKey, assetList: this.openPayOptions.assetList}
	Object.assign(message, this.openPayOptions)
	// WARNING: do not pass any sensitive data to the iframe instance
	delete message['privateKey']
	this.postMessage(message)
}

export class OpenPayIframe {
	setupResultHandler: Function;
	protected el: HTMLIFrameElement;
	public iFrameDomain: string
	public iFrameUri: string
	private encryptionKey: string;

	constructor (setupResultHandler: Function, decryptionKey: string, encryptionKey: string) {
		this.iFrameDomain = config.IFRAME_TARGET_DOMAIN
		this.iFrameUri = this.iFrameDomain + "/dist/openpay-setup/index.html"
		this.createOpenPayIframe();
		this.setupResultHandler = setupResultHandler;
		this.encryptionKey = encryptionKey;
		this.addPostMessageListeners(decryptionKey)
	}
	createOpenPayIframe = function() {
		let iFrameUri = this.iFrameUri
		if (!this.el) {
			this.el = window.document.createElement("iframe")
			this.el.setAttribute("style", "opacity: 1; height: 100%; position: relative; background: none; display: block; border: 0 none transparent; margin: 0px; padding: 0px; z-index: 2;")
			this.el.setAttribute("src", iFrameUri)
			this.el.setAttribute("id", "frame")
			this.el.frameBorder = 0
			this.el.style.width = 100 + "%"
			this.el.style.height = 100 + "%"
			this.el.postMessage = postMessage
			this.el.onload = onload
		}
		return this.el
	}


	addPostMessageListeners = function (decryptionKey: string) {
		window.addEventListener('message', (event) => {
			let data = Encryption.eciesDecryptString(event.data, decryptionKey)
			data = JSON.parse(data)
			this.setupResultHandler(data)
		})
	}

	openNewTab = function(options) {
		console.log('called openNewTab!');
		this.el = window.open('http://127.0.0.1:8777/dist/openpay-setup/index.html');
		setTimeout(() => {
			let message = {type: 'register'}
			Object.assign(message, this.openPayOptions)
			this.el.postMessage(JSON.stringify(message), "*")
			// this.el.sendEmailPrePopulationMessage = onload
			// this.el.sendEmailPrePopulationMessage()
			console.log('event s');
		}, 3000);
	}

	dispModal = function({template , width , height}) {
		let modalBackdrop = document.createElement('div');
		modalBackdrop.id = 'openpay-modal';
		modalBackdrop.style.position = 'fixed';
		modalBackdrop.style.top = '0';
		modalBackdrop.style.left = '0';
		modalBackdrop.style.width = '100%';
		modalBackdrop.style.height = '100%';
		modalBackdrop.style.background = 'rgba(0,0,0,0.5)';
		modalBackdrop.style.zIndex = '10001';
		modalBackdrop.style.display = 'flex';
		modalBackdrop.style.justifyContent = 'center';
		modalBackdrop.style.alignItems = 'center';

		let modal = document.createElement('div');
		modal.style.width = width ||'500px';
		modal.style.height = height || '300px';
		modal.style.borderRadius = '8px';
		modal.style.background = 'rgba(255,255,255,0)';

		// modal.innerHTML = template || '<div></div>';
		modal.appendChild(template)


		modalBackdrop.appendChild(modal);
		document.body.appendChild(modalBackdrop);
	}

	hideModal = function(){
		document.getElementById('openpay-modal').remove();
	}

	openIframe = function(walletState) {
		console.log('called open iframe!');
		this.el.openPayOptions = walletState
		this.dispModal({
			template: this.el,
			width: '900px',
			height: '700px'
		})
		// let elementId = this.openPayOptions['iframeEmbedElementId']
		// document.getElementById(elementId).appendChild(this.el)
	}


	open = function(walletState) {
		console.log('called open!')
		walletState.encryptionKey = this.encryptionKey;
		this.openIframe(walletState)
	}

	destroy = function() {
		let elementId = 'openpay-modal';
		document.getElementById(elementId).remove();
	}
}

