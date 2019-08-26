
let postMessage = function(message) {
	message = JSON.stringify(message)
	this.contentWindow.postMessage(message, "*")
}

let makeMessage = function(type) {
	if (type == 'register') {
		// the below item can be prototype
		return {
			type: 'register',
			payIDName: this.openPayOptions.payIDName,
			publicKey: this.openPayOptions.publicKey,
		}
	}
}

let onload = function() {
	console.log('called onload!')
	this.postMessage(this.makeMessage('register'))
}

export class OpenPayIframe {

	constructor (options) {
		this.createOpenPayIframe()
		this.parseOptions(options)
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
			this.el.makeMessage = makeMessage
			this.el.onload = onload
		}
		return this.el
	}

	parseOptions = function(options) {
		// TODO: add validation
		this.openPayOptions = options
		console.log('called parseOptions!')
	}

	sdkHandler = function(data) {
		// TODO: add sdk wala logic here
		var type = data.type
		if (type == 'register') {
			console.log(data)
		}
	}

	maskDataForWallet = function (data) {
		// manipulate to field that you want to send to wallet who called .open()
		// right now we pass everything
		return data
	}

	addPostMessageListeners = function () {
		var walletHandler = this.openPayOptions.handler
		var sdkHandler = this.sdkHandler
		var maskDataForWallet = this.maskDataForWallet
		window.addEventListener('message', function (event) {
			var data = JSON.parse(event.data)
			sdkHandler(data)
			var dataForWallet = maskDataForWallet(data)
			walletHandler(dataForWallet)
		})
	}

	open = function() {
		console.log('called open!')
		this.el.openPayOptions = this.openPayOptions
		let elementId = this.openPayOptions['iframeEmbedElementId']
		document.getElementById(elementId).appendChild(this.el)
		// this.onload()
		this.addPostMessageListeners()
	}

	destroy = function() {
		let elementId = this.openPayOptions['iframeEmbedElementId']
		document.getElementById(elementId).innerHTML = ''
	}
}

