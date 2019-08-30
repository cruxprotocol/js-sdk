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





// My changes

// let postMessage = function(message) {
// 	message = JSON.stringify(message)
// 	this.contentWindow.postMessage(message, "*")
// }

// let makeMessage = function(type) {
// 	if (type == 'close-newtab') {
// 		return {
// 			type: 'close'
// 		}
// 	}
// }

// let onload = function() {
// 	console.log('called onload!')
// 	let message = {type: 'register'}
// 	Object.assign(message, this.openPayOptions)
// 	this.postMessage(message)
// }

// export class OpenPayServiceIframe {

// 	iframeUrl:string = "http://127.0.0.1:8777/dist/openpay-setup/service.html"
// 	iframeDomain: string = "*"
// 	el = null;

// 	constructor (options) {
// 		if (!options.experience) {
// 			options.experience = 'iframe'
// 		}
// 		if (options.experience == 'iframe') {
// 			this.createOpenPayServiceIframe()
// 		} else {
// 			this.el = null
// 		}
// 		this.parseOptions(options)
// 	}

// 	createOpenPayServiceIframe = function() {
// 		if (!this.el) {
// 			this.el = window.document.createElement("iframe")
// 			this.el.setAttribute("style", "opacity: 1; height: 100%; position: relative; background: none; display: block; border: 0 none transparent; margin: 0px; padding: 0px; z-index: 2;")
// 			this.el.setAttribute("src", this.iframeUrl)
// 			this.el.setAttribute("id", "frame")
// 			this.el.frameBorder = 0
// 			this.el.style.width = 100 + "%"
// 			this.el.style.height = 100 + "%"
// 			this.el.postMessage = postMessage
// 			this.el.onload = onload
// 		}
// 		return this.el
// 	}

// 	parseOptions = function(options) {
// 		// TODO: add validation
// 		this.openPayOptions = options
// 		console.log('called parseOptions!')
// 	}

// 	addPostMessageListeners = function () {
// 		window.addEventListener('message', (event) => {
// 			let data = JSON.parse(event.data)
// 			let sdkCallback = this.openPayOptions['sdkCallback']
// 			sdkCallback(data)
// 			// this.openPayOptions.handler(this.maskDataForWallet(data))
// 		})
// 	}

// 	openNewTab = function(options) {
// 		console.log('called openNewTab!');
// 		this.el = window.open(this.iframeUrl);
// 	}

// 	openIframe = function() {
// 		console.log('called open iframe!');
// 		this.el.openPayOptions = this.openPayOptions
// 		let elementId = this.openPayOptions['iframeEmbedElementId']
// 		document.getElementById(elementId).appendChild(this.el)
// 	}

// 	open = function() {
// 		console.log('called open!')
// 		if (this.openPayOptions.experience == 'iframe') {
// 			this.openIframe()
// 		} else {
// 			this.openNewTab(this.openPayOptions)
// 		}
// 		this.addPostMessageListeners()
// 	}

// 	destroy = function() {
// 		let elementId = this.openPayOptions['iframeEmbedElementId']
// 		document.getElementById(elementId).innerHTML = ''
// 	}

// 	// payment_failed
// 	// payment_success
// 	// channel_creation_acknowledged
// 	// public_key

// 	sendMsg = (type: string, data?: any) => {
// 		let message = {type: type, data: data}
// 		this.el.postMessage(JSON.stringify(message), this.iframeDomain)
// 	}

// 	// payment_failed = function(){
// 	// 	let message = {'type': 'payment_failed'}
// 	// 	this.el.postMessage(JSON.stringify(message), "*")
// 	// }

// 	// payment_success = function(){
// 	// 	let message = {'type': 'payment_success'}
// 	// 	this.el.postMessage(JSON.stringify(message), "*")
// 	// };

// 	// channel_creation_acknowledged = function(){
// 	// 	let message = {'type': 'channel_creation_acknowledged'}
// 	// 	this.el.postMessage(JSON.stringify(message), "*")
// 	}

// 	// send_public_key = function(data){
// 	// 	let message = {'type': 'send_public_key', 'data': data}
// 	// 	this.el.postMessage(JSON.stringify(message), "*")
// 	// }
// }

