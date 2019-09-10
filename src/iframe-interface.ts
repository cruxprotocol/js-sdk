
let postMessage = function(message) {
	message = JSON.stringify(message)
	this.contentWindow.postMessage(message, "*")
}

let makeMessage = function(type) {
	if (type == 'close-newtab') {
		return {
			type: 'close'
		}
	}
}

let onload = function() {
	console.log('called onload!')
	let message = {type: 'register'}
	Object.assign(message, this.openPayOptions)
	this.postMessage(message)
}

export class OpenPayIframe {
	setupResultHandler: Function;

	constructor (setupResultHandler: Function) {
		this.createOpenPayIframe();
		this.setupResultHandler = setupResultHandler;
		this.addPostMessageListeners()
	}

	createOpenPayIframe = function() {
		if (!this.el) {
			this.el = window.document.createElement("iframe")
			this.el.setAttribute("style", "opacity: 1; height: 100%; position: relative; background: none; display: block; border: 0 none transparent; margin: 0px; padding: 0px; z-index: 2;")
			this.el.setAttribute("src", "http://127.0.0.1:8777/dist/openpay-setup/index.html")
			this.el.setAttribute("id", "frame")
			this.el.frameBorder = 0
			this.el.style.width = 100 + "%"
			this.el.style.height = 100 + "%"
			this.el.postMessage = postMessage
			this.el.onload = onload
		}
		return this.el
	}


	sdkHandler = function(data) {
		// TODO: add sdk wala logic here
		let type = data.type
		if (type == 'createNew') {
			console.log(data)
		}
	}

	maskDataForWallet = function (data) {
		// manipulate to field that you want to send to wallet who called .open()
		// right now we pass everything
		return data
	}

	addPostMessageListeners = function () {
		window.addEventListener('message', (event) => {
			let data = JSON.parse(event.data)
			this.sdkHandler(data)
			this.setupResultHandler(this.maskDataForWallet(data))
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
		modalBackdrop.style.zIndex = '100';
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
			width: '500px',
			height: '500px'
		})
		// let elementId = this.openPayOptions['iframeEmbedElementId']
		// document.getElementById(elementId).appendChild(this.el)
	}


	open = function(walletState) {
		console.log('called open!')
		this.openIframe(walletState)
	}

	destroy = function() {
		let elementId = 'openpay-modal';
		document.getElementById(elementId).remove();
	}
}

