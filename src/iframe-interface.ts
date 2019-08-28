
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

	constructor (options) {
		if (!options.experience) {
			options.experience = 'iframe'
		}
		if (options.experience == 'iframe') {
			this.createOpenPayIframe()
		} else {
			this.el = null
		}
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
		let type = data.type
		if (type == 'createNew') {
			console.log(data)
			if (this.openPayOptions.experience == 'newtab') {
				setTimeout(() => {
					let message = JSON.stringify(makeMessage('close-newtab'))
					this.el.postMessage(message, "*")
					console.log('close message sent' + message)
				}, 500);
			} else {
				let my_iframe = document.getElementById("frame")
				my_iframe.parentNode.removeChild(my_iframe)
			}
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
			this.openPayOptions.handler(this.maskDataForWallet(data))
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

	openIframe = function() {
		console.log('called open iframe!');
		this.el.openPayOptions = this.openPayOptions
		let elementId = this.openPayOptions['iframeEmbedElementId']
		document.getElementById(elementId).appendChild(this.el)
	}

	open = function() {
		console.log('called open!')
		if (this.openPayOptions.experience == 'iframe') {
			this.openIframe()
		} else {
			this.openNewTab(this.openPayOptions)
		}
		this.addPostMessageListeners()
	}

	destroy = function() {
		let elementId = this.openPayOptions['iframeEmbedElementId']
		document.getElementById(elementId).innerHTML = ''
	}
}

