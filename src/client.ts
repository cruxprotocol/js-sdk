import {OpenPayWallet} from "./index";

export default class OpenPayWalletClient {
	private static settings: any;
	private static wallet: OpenPayWallet;
	static async init(settings) {
		this.settings = settings;
		this.wallet = new OpenPayWallet({
			storage: settings.storage,
			setupHandler: this._openSetupResultHandler.bind(this),
			getEncryptionKey: settings.getKey
		});
		await this.wallet.init();

	}

	static getState(){
		let payIdClaim = this.wallet.getPayIDClaim();
		return {
			isSignedUp: Boolean(payIdClaim),
			payId: payIdClaim
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
			await this.wallet.addPayIDClaim(setupResult.data.newPayIDName, setupResult.data.newPayIDPass);
			console.log("after Generating ID");
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
		}
	}
}
