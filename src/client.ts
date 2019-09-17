import {getLogger, OpenPayWallet} from "./index";
let log = getLogger(__filename)

export default class OpenPayWalletClient {
	private static settings: any;
	private static wallet: OpenPayWallet;
	static async init(settings) {
		this.settings = settings;
		this.wallet = new OpenPayWallet({
			storage: settings.storage,
			setupHandler: this._onPostMessage.bind(this),
			getEncryptionKey: settings.getKey,
			walletClientName: 'scatter'
		});
		await this.wallet.init();
	}

	static async getState(){
		let hasPayIdClaim = this.wallet.hasPayIDClaim();
		let payIdClaim = hasPayIdClaim ? this.wallet.getPayIDClaim() : null;
		let status = await this.wallet.getIDStatus();
		return {
			isSignedUp: hasPayIdClaim,
			payId: payIdClaim,
            status: status
		}
	}

	static async resolveAddress(payIDName, currency){
		return await this.wallet.resolveAddress(payIDName, currency)
	}


	static async invokeSetup(){
		let walletAddressByCurrency = this.settings.walletGetAddressByCurrency();
		let openPaySetupState = {
			availableCurrencies: Object.keys(walletAddressByCurrency)
		};

		await this.wallet.invokeSetup(openPaySetupState)
	}

	static async _onPostMessage(postMessage) {
		log.info("postMessage received!");
		log.info(postMessage);
		let messageType = postMessage['type']
		switch(messageType){
			case "editExisting":
			case "createNew":
				await this._openSetupResultHandler(postMessage)
				break;
			case "closeIframe":
				this.wallet.destroySetup();
				break;
			default:
				console.warn('unhandled:' + postMessage)
		}
	}

	static async _openSetupResultHandler(setupResult){
		console.log("_openSetupResultHandler start");
		console.log(setupResult);
		console.log("setupResult got!");
		this.wallet.destroySetup();
		console.log("after destroySetup!");
		let approved = await this.settings.walletOpenApprovalPopup(setupResult);
		console.log("after await openApprovalPopup");
		console.log(approved)
		if (approved) {
			console.log("approved!");
			await this._handleSetupResultApproval(setupResult)
			console.log("after _handleSetupResultApproval!");
		}
	}

	static async _handleSetupResultApproval(setupResult) {
		console.log("inside _handleSetupResultApproval!");
		if(setupResult.type === 'createNew') {
			console.log("Approved! Generating ID");
			let newAddressMap = {};
			if (setupResult.data.checkedCurrencies) {
				let addressByCurrency = this.settings.walletGetAddressByCurrency();
				for (let cur of setupResult.data.checkedCurrencies) {
					if(addressByCurrency[cur]) {
						newAddressMap[cur] = {addressHash: addressByCurrency[cur]}
					}
				}
				console.log("Created Address Map in createNew path");
				console.log(newAddressMap);
			}

			await this.wallet.addPayIDClaim(setupResult.data.newPayIDName, setupResult.data.newPayIDPass, newAddressMap);
			console.log("after Generating ID");
			this.settings.walletAcknowledgeAction({'status': 'success'})
		} else if (setupResult.type === 'editExisting') {
			console.log("edit existing")
			let addressByCurrency = this.settings.walletGetAddressByCurrency();
			let newAddressMap = {};
			for (let cur of setupResult.data.checkedCurrencies) {
				if(addressByCurrency[cur]) {
					newAddressMap[cur] = {addressHash: addressByCurrency[cur]}
				}
			}
			console.log("put address map");
			console.log(newAddressMap);
			await this.wallet.putAddressMap(newAddressMap)
			this.settings.walletAcknowledgeAction({'status': 'success'})
		}
	}
}
