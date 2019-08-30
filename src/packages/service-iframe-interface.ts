import {MessageProcessor} from ".."

let postMessage = function(message) {
	message = JSON.stringify(message)
	this.contentWindow.postMessage(message, "*")
}

let onload = function() {
	console.log('called onload!')
	let message = {type: 'register'}
	Object.assign(message, this.openPayOptions)
	this.postMessage(message)
}

export class OpenPayServiceIframe {

	iframeUrl:string = "http://127.0.0.1:8777/dist/openpay-setup/service.html"
	el = null
	mp = null
	openPayOptions = null

	constructor (options) {
		if (!options.experience) {
			options.experience = 'iframe'
		}
		// this.validateOptions(options)
		this.openPayOptions = options
		if (options.experience == 'iframe') {
			this.createOpenPayServiceIframe()
		} else {
			this.el = null
		}
	}

	createOpenPayServiceIframe = function() {
		if (!this.el) {
			this.el = window.document.createElement("iframe")
			this.el.setAttribute("style", "opacity: 1; height: 100%; position: relative; background: none; display: block; border: 0 none transparent; margin: 0px; padding: 0px; z-index: 2;")
			this.el.setAttribute("src", this.iframeUrl)
			this.el.setAttribute("id", "frame")
			this.el.frameBorder = 0
			this.el.style.width = 100 + "%"
			this.el.style.height = 100 + "%"
			this.el.postMessage = postMessage
			this.el.onload = onload
		}
		return this.el
	}

	validateOptions = function(options) {
		// TODO: add validation
	}

	openNewTab = function(options) {
		console.log('called openNewTab!')
		this.el = window.open(this.iframeUrl)
		this.mp = new MessageProcessor('newtab', this.el, '*', this.sdkHandler);
		this.payment_failed()
	}

	openIframe = function() {
		console.log('called open iframe!')
		this.el.openPayOptions = this.openPayOptions
		let elementId = this.openPayOptions['iframeEmbedElementId']
		document.getElementById(elementId).appendChild(this.el)
		this.mp = new MessageProcessor('iframe', this.contentWindow,'*', this.openPayOptions.sdkHandler)
	}

	open = function() {
		console.log('called open!')
		if (this.openPayOptions.experience == 'iframe') {
			this.openIframe()
		} else {
			this.openNewTab(this.openPayOptions)
		}
	}

	destroy = function() {
		if (this.openPayOptions.experience == 'iframe') {
			let elementId = this.openPayOptions['iframeEmbedElementId']
			document.getElementById(elementId).innerHTML = ''
		} else {
			this.mp.communicator.postMessage('close')
		}
	}

	payment_failed = function(){
		this.mp.communicator.postMessage('payment_failed')
	}

	payment_success = function(){
		this.mp.communicator.postMessage('payment_success')
	}

	channel_creation_acknowledged = function(){
		this.mp.communicator.postMessage('channel_creation_acknowledged')
	}
}

