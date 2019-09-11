import { EventEmitter } from "eventemitter3";
import { OpenPayIframe } from "./iframe-interface";
import 'regenerator-runtime/runtime';
import Logger from "js-logger";
import path from "path";

// Setup logging configuration
Logger.useDefaults();
Logger.setLevel(Logger.DEBUG);
export function getLogger (filename) {
    return Logger.get("OpenPay: " + filename.slice(filename.lastIndexOf(path.sep)+1, filename.length -3))
}
let log = getLogger(__filename)

import {
    StorageService, LocalStorage,
    Encryption,
    PubSubService, PeerJSService,
    NameService, BlockstackService,
    TokenController,
    MessageProcessor, OpenPayServiceIframe
} from "./packages";
import { IIdentityClaim } from "./packages/nameservice";

export { LocalStorage, Encryption, PeerJSService, BlockstackService, TokenController, MessageProcessor, OpenPayServiceIframe }


// TODO: Implement classes enforcing the interfaces
export interface IAddress {
    addressHash: string
    secIdentifier?: string
}

export interface IAddressMapping {
    [currency: string]: IAddress
}

export interface PubSubMessage {
    format: string
    type: string
    id?: string
}

export interface Message extends PubSubMessage {
    payload: IPaymentRequest
}

export interface Ack extends PubSubMessage {
    payload: IPaymentAck
}

export interface IPaymentRequest {
    currency: string
    fromAddress?: IAddress
    toAddress: IAddress
    value: number
}

export interface IPaymentAck {
    ackid: string
    request: IPaymentRequest
}

var Errors = Object.freeze({
    data_channel: 'data_channel'
});

var PubSubMessageType = Object.freeze({
    ack: 'ack',
    payment: 'payment'
})

export {Errors, PubSubMessageType};

export interface error {
    code: string,
    msg?: string
}

export class AddressMapping {
    constructor(values: IAddressMapping | any = {}) {
        Object.assign(this, values);
    }
    toJSON() {
        return Object.assign({}, this)
    }
}



// SDK core class

interface IOpenPayPeerOptions {
    getEncryptionKey: () => string
    storage?: StorageService
    encryption?: typeof Encryption
    pubsub?: PubSubService
    nameservice?: NameService,
	setupHandler?: Function
}

interface IIdentitySecrets{
    [nameservice: string]: IIdentityClaim
}

interface IOpenPayClaim {
    virtualAddress?: string;
    passcodeHash?: string;   // (Always in encrypted format in-memory for now)
    identitySecrets?: string | IIdentityClaim;
}

interface openPayOptions {
    getEncryptionKey: () => string;
    encryption?: typeof Encryption;
    storage?: StorageService;
}


class PayIDClaim implements IOpenPayClaim {
    private _getEncryptionKey: () => string;
    private _encryption: typeof Encryption = Encryption;
    private _storage: StorageService = new LocalStorage();

    public passcodeHash: string;
    public virtualAddress: string;
    public identitySecrets: string | IIdentityClaim;

    constructor(openPayObj: IOpenPayClaim = {} as IOpenPayClaim, options: openPayOptions) {
        if (!options.getEncryptionKey) throw (`Missing encryptionKey method!`)
        this._getEncryptionKey = options.getEncryptionKey

        if (options.encryption) this._encryption = options.encryption
        if (options.storage) this._storage = options.storage

        log.debug(`OpenPayObj provided:`, openPayObj)
        this.passcodeHash = openPayObj.passcodeHash || undefined
        this.virtualAddress = openPayObj.virtualAddress || undefined
        this.identitySecrets = openPayObj.identitySecrets || undefined
    }

    private _isEncrypted = (): boolean => {
        return typeof this.identitySecrets !== 'object'
    }

    private _getPasscode = async (): Promise<string> => {
        if (!this.passcodeHash) throw (`Missing passcode!`)
        let encryptedObj = JSON.parse(this.passcodeHash)
        let passcodeHash = await this._encryption.decryptText(encryptedObj.encBuffer, encryptedObj.iv, this._getEncryptionKey())
        return passcodeHash
    }

    public setPasscode = async (passcode: string): Promise<void> => {
        let passcodeHash = await this._encryption.digest(passcode)
        this.passcodeHash = JSON.stringify(await this._encryption.encryptText(passcodeHash, this._getEncryptionKey()))
        log.debug(`Passcode Hash:`, this.passcodeHash)
        await this.encrypt()
    }

    public encrypt = async (): Promise<void> => {
        log.debug(`Encrypting PayIDClaim`)
        if (!this.passcodeHash) throw (`Missing passcode!`)
        if (!this._isEncrypted()) {
            // Encrypt the identitySecrets
            let passcodeHash = await this._getPasscode()
            this.identitySecrets = JSON.stringify(await this._encryption.encryptJSON(<object>this.identitySecrets, passcodeHash))
        }
    }

    public decrypt = async (): Promise<void> => {
        log.debug(`Decrypting PayIDClaim`)
        if (!this.passcodeHash) throw (`Missing passcode!`)
        if (this._isEncrypted()) {
            // Decrypt the identitySecrets
            let passcodeHash = await this._getPasscode()
            let encryptedObj = JSON.parse(<string>this.identitySecrets)
            this.identitySecrets = <IIdentityClaim>await this._encryption.decryptJSON(encryptedObj.encBuffer, encryptedObj.iv, passcodeHash)
        }
    }

    public toJSON = (): IOpenPayClaim => {
        // await this.encrypt()
        let json = JSON.parse(JSON.stringify({
            passcodeHash: this.passcodeHash,
            virtualAddress: this.virtualAddress,
            identitySecrets: this.identitySecrets
        }))
        return json
    }

    public save = async (): Promise<void> => {
        let json = await this.toJSON()
        log.debug(`PayIDClaim being stored to storage:`, json)
        this._storage.setJSON('payIDClaim', json)
    }

}

class OpenPayPeer extends EventEmitter {
    protected _options: IOpenPayPeerOptions
    protected _getEncryptionKey: () => string

    protected _storage: StorageService
    protected _encryption: typeof Encryption
    protected _pubsub: PubSubService
    protected _nameservice: NameService

    protected _payIDClaim: PayIDClaim

    constructor(_options: IOpenPayPeerOptions) {
        super();

        this._options = Object.assign({}, _options)
        // TODO: Need to validate options

        this._getEncryptionKey = _options.getEncryptionKey
        log.debug(`Encryption key:`, this._getEncryptionKey())

        // Setting up the default modules as fallbacks
        this._storage =  this._options.storage || new LocalStorage()
        this._encryption = this._options.encryption || Encryption
        this._nameservice = this._options.nameservice || new BlockstackService()

        if (this._hasPayIDClaimStored()) {
            let payIDClaim = this._storage.getJSON('payIDClaim')
            log.debug(`Local payIDClaim:`, payIDClaim)
            this._setPayIDClaim(new PayIDClaim(payIDClaim as IOpenPayClaim, { getEncryptionKey: this._getEncryptionKey }))
            this._restoreIdentity()
        }
        else {
            this._nameservice.generateIdentity()
                .then(identityClaim => {
                    let payIDClaim = {identitySecrets: identityClaim.secrets}
                    this._setPayIDClaim(new PayIDClaim(payIDClaim as IOpenPayClaim, { getEncryptionKey: this._getEncryptionKey }))
                    log.debug(`Allocated temporary identitySecrets and payIDClaim`)
                })
        }
        log.info(`OpenPayPeer Initialised`)
    }

    private _restoreIdentity = async () => {
        // if have local identitySecret, setup with the nameservice module
        if ( this._payIDClaim && this._payIDClaim.identitySecrets ) {
            await this._payIDClaim.decrypt()
            await this._nameservice.restoreIdentity({ identitySecrets: this._payIDClaim.identitySecrets})
                .then(identityClaim => {
                    this._payIDClaim.identitySecrets = identityClaim.secrets
                    log.debug(`PayIDClaim with restored identity:`, this._payIDClaim)
                    log.info(`Identity restored`)
                })
                .catch(err => log.error(err))
                .finally(async () => {
                    log.debug('finally block')
                    await this._payIDClaim.encrypt()
                    this._storage.setJSON('payIDClaim', this._payIDClaim.toJSON())
                })

        }
        else {
            log.info(`payIDClaim or identitySecrets not available! Identity restoration skipped`)
        }
    }

    public hasPayIDClaim = (): boolean =>  {
        return Boolean(this._payIDClaim && this._payIDClaim.passcodeHash)
    }

    public getPayIDClaim = (): PayIDClaim => {
        return this._payIDClaim
    }

    public addPayIDClaim = async (virtualAddress: string, passcode: string): Promise<void> => {
        this._setPayIDClaim(new PayIDClaim({virtualAddress}, { getEncryptionKey: this._getEncryptionKey }))
        await this._payIDClaim.setPasscode(passcode)
        this._storage.setJSON('payIDClaim', this._payIDClaim.toJSON())
        this._restoreIdentity()
    }

    private _hasPayIDClaimStored = (): boolean => {
        let payIDClaim = this._storage.getJSON('payIDClaim')
        return payIDClaim && payIDClaim['passcodeHash']
    }

    protected _setPayIDClaim = (payIDClaim: PayIDClaim): void => {
        this._payIDClaim = payIDClaim
    }

    public getPublicIdAvailability = (username: string): Promise<boolean> => {
        return this._nameservice.getNameAvailability(username)
    }

    public resolveAddress = async (receiverVirtualAddress: string, currency: string): Promise<IAddress> => {
        let addressMap = await this._nameservice.getAddressMapping(receiverVirtualAddress)
        log.debug(`Address map: `, addressMap)
        let address: IAddress = addressMap[currency] || addressMap[currency.toLowerCase()]
        log.debug(`Address:`, address)
        return address
    }

}


// Wallets specific SDK code
export class OpenPayWallet extends OpenPayPeer {
	private walletSetupUi: OpenPayIframe;

    constructor(_options?: IOpenPayPeerOptions) {
        super(_options);
        this._options = _options;

    }

    public init = async () => {
		await this._payIDClaim.decrypt().catch(e => log.error(e))
		let decryptionKey = await this._nameservice.getDecryptionKey({ secrets: this._payIDClaim.identitySecrets })
		let encryptionKey = await this._nameservice.getEncryptionKey({ secrets: this._payIDClaim.identitySecrets })
		await this._payIDClaim.encrypt().catch(e => log.error(e))
		this.walletSetupUi = new OpenPayIframe(this._options.setupHandler, decryptionKey, encryptionKey);
		log.info(`OpenPayWallet Initialised`)
	}

	public invokeSetup = async (openPaySetupState: JSON): Promise<void> => {
        log.info("Setup Invoked")
		openPaySetupState['payIDName'] = this._payIDClaim && this._payIDClaim.passcodeHash && this._payIDClaim.virtualAddress
        let addressMap = await this.getAddressMap();
        log.info(addressMap)
		openPaySetupState['publicAddressCurrencies'] = Object.keys(addressMap).map(x=>x.toUpperCase());


		log.info("Passing openPaySetupState to walletSetupUi")
        log.info(openPaySetupState)
		this.walletSetupUi.open(openPaySetupState);
	}

	public destroySetup = (): void => {
		this.walletSetupUi.destroy()
    }

    // NameService specific methods

    public addPayIDClaim = async (virtualAddress: string, passcode: string, addressMap?: IAddressMapping): Promise<void> => {
        // Generating the identityClaim
        let identityClaim = await this._nameservice.generateIdentity()
        let registeredPublicID = await this._nameservice.registerName(identityClaim, virtualAddress)

        // Setup the payIDClaim locally
        this._setPayIDClaim(new PayIDClaim({virtualAddress: registeredPublicID, identitySecrets: identityClaim.secrets}, { getEncryptionKey: this._getEncryptionKey }))
        await this._payIDClaim.setPasscode(passcode)
        this._storage.setJSON('payIDClaim', this._payIDClaim.toJSON())

        // TODO: Setup public addresses
        if (addressMap) {
            alert(`Selected addresses for resolving via your ID: ${
                Object.keys(addressMap).map(currency => {
                    return `\n${addressMap[currency].addressHash}`
                })
            }`)
            await this.putAddressMap(addressMap)
        }

    }

    public putAddressMap = async (addressMap: IAddressMapping): Promise<boolean> => {
        await this._payIDClaim.decrypt()
        let acknowledgement = await this._nameservice.putAddressMapping({secrets: this._payIDClaim.identitySecrets}, addressMap)
        await this._payIDClaim.encrypt()

        if (!acknowledgement) throw (`Could not update the addressMap`)
        return acknowledgement
    }

    public getAddressMap = async (): Promise<IAddressMapping> => {
        if(this._payIDClaim && this._payIDClaim.passcodeHash){
            return this._nameservice.getAddressMapping(this._payIDClaim.virtualAddress);
        } else {
            return {};
        }
    }

}

// Services specific SDK code
export class OpenPayService extends OpenPayPeer {
    constructor(_options?: IOpenPayPeerOptions) {
        super(_options);
        log.info(`OpenPayService Initialised`)
    }

}




// Experimental implementations

export class OpenPayWalletExperimental extends OpenPayPeer {
    protected _pubsub: PubSubService

    constructor(_options: IOpenPayPeerOptions) {
        super(_options);
        this._options = Object.assign({}, _options)

        this._pubsub = this._options.pubsub || new PeerJSService({
            storage: this._storage,
            encryption: this._options.encryption
        })
        this._pubsub.on('ack', message => {
            console.log(`open pay peer recieved ack :- ${JSON.stringify(message)}`);
            this.emit('ack', message);
        })
        log.info(`OpenPayWalletExperimental Initialised`)
    }

    public isActive = () => this._pubsub.isActive()

    public isListening = () => this._pubsub.isListening()
    
    public sendMessageToChannelId = async (topic, payload: PubSubMessage) => {
        let requestId = topic + "-" + String(Date.now())
        if(!payload.id){
            payload.id = requestId;
        }
        payload = Object.assign(payload, {format: "openpay_v1"});
        this._pubsub.publishMsg(topic, payload);
        return requestId;
    }

    public activateListener = async (dataCallback?: (requestObj: JSON) => void): Promise<void> => {
        if (!this._payIDClaim) throw ("Need PayIDClaim setup!")

        // Derive the decryption privateKey from the nameservice module
        await this._payIDClaim.decrypt()
        let decryptionPrivateKey = await this._nameservice.getDecryptionKey({secrets: this._payIDClaim.identitySecrets})
        await this._payIDClaim.encrypt()

        await this._pubsub.registerTopic(this._payIDClaim, decryptionPrivateKey, undefined, (dataObj: JSON) => {
            this.emit('request', dataObj)
            if (dataCallback) dataCallback(dataObj)
        })
    }
}

export class OpenPayServiceExperimental extends OpenPayWalletExperimental {
    protected _iframe: OpenPayServiceIframe;

    constructor(_options: IOpenPayPeerOptions) {
        super(_options);
        log.info(`OpenPayServiceExperimental Initialised`)
    }

    public async loginUsingPayIDClaim(recieverVirtualAddress: string, accessTokenData: any){
        let receiverPublicKey = await this._nameservice.resolveName(recieverVirtualAddress)
        log.debug(`receiver virtual address: ${recieverVirtualAddress} and public key: ${receiverPublicKey}`);
        
        // maintain login state in the underlying pubsub and not in this layer
        await this._pubsub.connectToPeer(this._payIDClaim, recieverVirtualAddress, receiverPublicKey, accessTokenData);
    }

    public _sendPaymentRequest = async (receiverVirtualAddress: string, paymentRequest: IPaymentRequest, accessTokenData): Promise<string> => {
        await this.loginUsingPayIDClaim(receiverVirtualAddress, accessTokenData);
        let payload: Message = {format: "openpay_v1", type: PubSubMessageType.payment, id: String(Date.now()), payload: paymentRequest};
        log.debug(`Payment request payload: `, payload)
        this._pubsub.publishMsg(receiverVirtualAddress, payload)
        return payload.id
    }

    // Iframe UI handler methods

    private _onPostMessage = (paymentRequest) => {
        return async (message) => {
            switch(message.type){

                case "get_public_key":
                    let receiverVirtualAddress = message.data.openpay_id
                    log.debug(`Openpay receiverVirtualAddress provided: `, receiverVirtualAddress)
                    let receiverPublicKey = await this._nameservice.resolveName(receiverVirtualAddress)
                    log.debug(`Receiver public key: `, receiverPublicKey)
                    this._iframe.send_message('public_key', {public_key: receiverPublicKey})
                    break;

                case "encryption_payload": 
                    log.debug(`Receiver details: `, message.data.receiverData)
                    let receiverData = message.data.receiverData
                    log.debug(`Encryption payload provided: `, message.data.encryptionPayload)
                    let encryptionPayload = message.data.encryptionPayload
                    // Build the payment request
                    await this._sendPaymentRequest(receiverData.receiverVirtualAddress, paymentRequest, encryptionPayload)
                    this._pubsub.on('ack', payload => {
                        log.debug(`acknowledgement payload: `, payload)
                        
                        if (payload.payload.type == 'payment_received') {
                            log.debug(`Acknowledgement received for receipt of payment request`)
                            this._iframe.send_message('payment_request_received')
                        }
                        else if (payload.payload.type == 'payment_initiated') {
                            log.debug(`Acknowledgement received for successful action on the payment request`)
                            this._iframe.send_message('payment_initiated')
                            this.emit('payment_initiated')
                        }
                    })
                    break;
                
                case "close":
                    this.emit('close')
                    this._iframe.destroy()
                    break;
                
                default:
                    console.warn('unhandled:' + JSON.stringify(message))
            }
        }
    }

	public payWithOpenpay = (serviceIframeOptions: JSON, paymentRequest: IPaymentRequest): void => {
        log.info("Service setup invoked")
        Object.assign(serviceIframeOptions, {sdkCallback: this._onPostMessage(paymentRequest) })
		this._iframe = new OpenPayServiceIframe(serviceIframeOptions);
        this._iframe.open();
    }
}
