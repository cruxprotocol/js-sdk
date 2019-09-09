import {MessageProcessor} from ".."

let onload = function() {
	// NOTE: if we need to send something to iframe at start it goes here
	console.log('called onload!')
}

export class OpenPayServiceIframe {

	iframeUrl:string = "http://127.0.0.1:8777/dist/openpay-setup/service.html"
	iframeDomain: string = '*'
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
			this.el.setAttribute("src", this.iframeUrl + "?mode=iframe")
			this.el.setAttribute("id", "frame")
			this.el.frameBorder = 0
			this.el.style.width = 100 + "%"
			this.el.style.height = 100 + "%"
			this.el.onload = onload
		}
		return this.el
	}

	validateOptions = function(options) {
		// TODO: add validation
	}

	openNewTab = function(options) {
		console.log('called openNewTab!')
		this.el = window.open(this.iframeUrl + "?mode=newtab")
		this.mp = new MessageProcessor('newtab', this.el, this.iframeDomain, this.openPayOptions.sdkCallback);
	}

	openIframe = function() {
		console.log('called open iframe!')
		// this.el.openPayOptions = this.openPayOptions
		let elementId = this.openPayOptions['iframeEmbedElementId']
		document.getElementById(elementId).appendChild(this.el)
		this.mp = new MessageProcessor('iframe', this.el.contentWindow, this.iframeDomain, this.openPayOptions.sdkCallback)
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
			this.send_message('close', {})
		}
	}

	send_message = (type, data = {}) => {
		this.mp.communicator.postMessage(type, data)
	}
}
