import { EventEmitter } from "eventemitter3";
import { OpenPayIframe } from "./iframe-interface";
import 'regenerator-runtime/runtime';
import Logger from "js-logger";
import path from "path";
var fs = require("fs");

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
import { object } from "@mojotech/json-type-validation";
import { ITokenPayload } from "./packages/token";

export { LocalStorage, Encryption, PeerJSService, BlockstackService, TokenController, MessageProcessor, OpenPayServiceIframe }


// TODO: Implement classes enforcing the interfaces
export interface IPayIDClaim {
    virtualAddress: string
    passcode: string
    identitySecrets?: any
}

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
    storage?: StorageService
    encryption?: typeof Encryption
    pubsub?: PubSubService
    nameservice?: NameService, 
    name: string
}

class OpenPayPeer extends EventEmitter {
    protected _options: IOpenPayPeerOptions

    protected _storage: StorageService
    protected _encryption: typeof Encryption
    protected _pubsub: PubSubService
    protected _nameservice: NameService
    public name: string
    protected _payIDClaim: IPayIDClaim
    protected _assetList: JSON
    protected _clientMapping: JSON

    constructor(_options: IOpenPayPeerOptions) {
        super();

        this._options = Object.assign({}, _options)
        // TODO: Need to validate options

        // Setting up the default modules as fallbacks
        this._storage =  this._options.storage || new LocalStorage()
        this._encryption = this._options.encryption || Encryption
        this._nameservice = this._options.nameservice || new BlockstackService()
        this.name = this._options.name || 'scatter'

        if (this._hasPayIDClaimStored) {
            let payIDClaim = this._storage.getJSON('payIDClaim')
            this._setPayIDClaim(payIDClaim)
            this._restoreIdentity()
        }
        log.info(`OpenPayPeer Initialised`)

        this._assetList = JSON.parse(fs.readFileSync("asset-list.json", "utf-8"));
        this._clientMapping = JSON.parse(fs.readFileSync("client-mapping.json", "utf-8"))[this.name];
    }

    private _restoreIdentity() {
        // if have local identitySecret, setup with the nameservice module
        if ( this._payIDClaim && this._payIDClaim.identitySecrets ) {
            this._nameservice.restoreIdentity({ identitySecrets: this._payIDClaim.identitySecrets})
                .then(identityClaim => {
                    this._payIDClaim.identitySecrets = identityClaim.secrets
                    log.debug(`PayIDClaim with restored identity: `, this._payIDClaim)
                    this._storage.setJSON('payIDClaim', this._payIDClaim)
                    log.info(`Identity restored`)
                })
                .catch(err => log.error(err))
        }
        else {
            log.info(`payIDClaim or identitySecrets not available! Identity restoration skipped`)
        }
    }

    public hasPayIDClaim = (): boolean =>  {
        return Boolean(this._payIDClaim)
    }

    public getPayIDClaim = (): IPayIDClaim => {
        return this._payIDClaim
    }

    public addPayIDClaim = async (virtualAddress: string, passcode: string): Promise<void> => {
        let payIDClaim: IPayIDClaim = {
            virtualAddress: virtualAddress,
            passcode: passcode
        }
        this._storage.setJSON('payIDClaim', payIDClaim)
        this._setPayIDClaim(payIDClaim)
        this._restoreIdentity()
    }

    private _hasPayIDClaimStored = (): boolean => {
        return Boolean(this._storage.getJSON('payIDClaim'))
    }

    protected _setPayIDClaim = (payIDClaim: IPayIDClaim): void => {
        this._payIDClaim = payIDClaim
    }

    public getPublicIdAvailability = (username: string): Promise<boolean> => {
        return this._nameservice.getNameAvailability(username)
    }

    public resolveAddress = async (receiverVirtualAddress: string, currency: string): Promise<IAddress> => {
        let addressMap = await this._nameservice.getAddressMapping(receiverVirtualAddress)
        log.debug(`Address map: `, addressMap)
        let address: IAddress = addressMap[currency] || addressMap[currency.toLowerCase()]
        return address
    }

}


// Wallets specific SDK code
export class OpenPayWallet extends OpenPayPeer {

    constructor(_options?: IOpenPayPeerOptions) {
        super(_options);
        log.info(`OpenPayWallet Initialised`)
    }

	public invokeSetup = async (openPaySetupOptions: JSON): Promise<void> => {
        log.info("Setup Invoked")
        openPaySetupOptions['payIDName'] = this._payIDClaim && this._payIDClaim.virtualAddress
        let addressMap = await this.getAddressMap();
        log.info(addressMap)
        openPaySetupOptions['publicAddressCurrencies'] = Object.keys(addressMap).map(x=>x.toUpperCase());
        log.info(openPaySetupOptions)
		let cs = new OpenPayIframe(openPaySetupOptions);
		cs.open();
	}

	public destroySetup = (openPaySetupOptions: JSON): void => {
        let cs = new OpenPayIframe(openPaySetupOptions); // TODO: This is being initialized twice
        cs.destroy();
    }
    // NameService specific methods

    public addPayIDClaim = async (virtualAddress: string, passcode: string, addressMap?: IAddressMapping): Promise<void> => {
        // Generating the identityClaim
        let identityClaim = await this._nameservice.generateIdentity()
        let registeredPublicID = await this._nameservice.registerName(virtualAddress)
        // Setup the payIDClaim locally
        let payIDClaim: IPayIDClaim = {
            virtualAddress: registeredPublicID,
            passcode: passcode,
            identitySecrets: identityClaim.secrets
        }
        this._storage.setJSON('payIDClaim', payIDClaim)
        this._setPayIDClaim(payIDClaim)

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
        let csAddressMap = {}
        for(let key in addressMap){
            csAddressMap[this._clientMapping[key]] = addressMap[key]
        }
        let acknowledgement = await this._nameservice.putAddressMapping(csAddressMap)
        if (!acknowledgement) throw (`Could not update the addressMap`)
        return acknowledgement
    }

    public getAddressMap = async (): Promise<IAddressMapping> => {
        let clientIdToAssetIdMap = {}
        for(let i in this._clientMapping){
            clientIdToAssetIdMap[this._clientMapping[i]] = i
        }

        let clientIdMap = {}
        if(this._payIDClaim){
            let assetIdMap = await this._nameservice.getAddressMapping(this._payIDClaim.virtualAddress);
            for(let key in assetIdMap){
                clientIdMap[clientIdToAssetIdMap[key]] = assetIdMap
            }
            return clientIdMap;
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
        let decryptionPrivateKey = await this._nameservice.getDecryptionKey()

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