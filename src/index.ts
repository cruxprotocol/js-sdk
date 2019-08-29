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
    NameService, BlockstackService
} from "./packages";
import { object } from "@mojotech/json-type-validation";

export { LocalStorage, Encryption, PeerJSService, BlockstackService }


// TODO: Implement classes enforcing the interfaces
export interface IPayIDClaim {
    virtualAddress: string
    passcode: string
    identitySecret?: string
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
    nameservice?: NameService
}

class OpenPayPeer extends EventEmitter {
    protected _options: IOpenPayPeerOptions

    protected _storage: StorageService
    protected _encryption: typeof Encryption
    protected _pubsub: PubSubService
    protected _nameservice: NameService

    protected _payIDClaim: IPayIDClaim

    constructor(_options: IOpenPayPeerOptions) {
        super();

        this._options = Object.assign({}, _options)
        // TODO: Need to validate options

        // Setting up the default modules as fallbacks
        this._storage =  this._options.storage || new LocalStorage()
        this._encryption = this._options.encryption || Encryption
        this._pubsub = this._options.pubsub || new PeerJSService({
            storage: this._storage,
            encryption: this._options.encryption
        })
        this._pubsub.on('ack', message => {
            console.log(`open pay peer recieved ack :- ${JSON.stringify(message)}`);
            this.emit('ack', message);
        })
        this._nameservice = this._options.nameservice || new BlockstackService()

        if (this._hasPayIDClaimStored) {
            let payIDClaim = this._storage.getJSON('payIDClaim')
            this._setPayIDClaim(payIDClaim)
            // if have local identitySecret, setup with the nameservice module
            try{
                if ( this._payIDClaim && this._payIDClaim.identitySecret ) this._nameservice.restoreIdentity({ identitySecret: this._payIDClaim.identitySecret})
            }
            catch(error){
                log.info(`Unable to restore identity for ${this._payIDClaim}`)
            }
        }
        log.info(`OpenPayPeer Initialised`)
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
        if ( this._payIDClaim && this._payIDClaim.identitySecret ) this._nameservice.restoreIdentity({ identitySecret: this._payIDClaim.identitySecret})
    }

    private _hasPayIDClaimStored = (): boolean => {
        return Boolean(this._storage.getJSON('payIDClaim'))
    }

    protected _setPayIDClaim = (payIDClaim: IPayIDClaim): void => {
        this._payIDClaim = payIDClaim
    }

    public isActive = () => this._pubsub.isActive()

    public isListening = () => this._pubsub.isListening()

    public getPublicIdAvailability = (username: string): Promise<boolean> => {
        return this._nameservice.getNameAvailability(username)
    }

    public resolveAddress = async (receiverVirtualAddress: string, currency: string): Promise<IAddress> => {
        let addressMap = await this._nameservice.getAddressMapping(receiverVirtualAddress)
        log.debug(`Address map: `, addressMap)
        let address: IAddress = addressMap[currency] || addressMap[currency.toLowerCase()]
        return address
    }

    public sendMessageToChannelId = async (topic, payload: PubSubMessage) => {
        if(!payload.id){
            payload.id = String(Date.now());
        }
        payload = Object.assign(payload, {format: "openpay_v1"});
        this._pubsub.publishMsg(topic, payload);
    }
}



// Wallets specific SDK code
export class OpenPayWallet extends OpenPayPeer {

    constructor(_options: IOpenPayPeerOptions) {
        super(_options);
        log.info(`OpenPayWallet Initialised`)
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
        let identityClaim = this._nameservice.generateIdentity()
        let registeredPublicID = await this._nameservice.registerName(virtualAddress)
        // Setup the payIDClaim locally
        let payIDClaim: IPayIDClaim = {
            virtualAddress: registeredPublicID,
            passcode: passcode,
            identitySecret: identityClaim.secret
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
        let acknowledgement = await this._nameservice.putAddressMapping(addressMap)
        if (!acknowledgement) throw (`Could not update the addressMap`)
        return acknowledgement
    }

    public getAddressMap = async (): Promise<IAddressMapping> => {
        if(this._payIDClaim){
            return this._nameservice.getAddressMapping(this._payIDClaim.virtualAddress);
        } else {
            return {};
        }
    }


}




// Services specific SDK code
export class OpenPayService extends OpenPayPeer {

    constructor(_options: IOpenPayPeerOptions) {
        super(_options);
        log.info(`OpenPayService Initialised`)
    }

    public async loginUsingPayIDClaim(recieverVirtualAddress: string, receiverPassCode?: string){
        receiverPassCode = receiverPassCode || prompt("Receiver passcode");
        let receiverPublicKey = await this._nameservice.resolveName(recieverVirtualAddress)
        console.log(`payidclaim ${this._payIDClaim} virtual address ${recieverVirtualAddress} public key ${receiverPublicKey} passcode ${receiverPassCode}`);

        // maintain login state in the underlying pubsub and not in this layer
        await this._pubsub.connectToPeer(this._payIDClaim, recieverVirtualAddress, receiverPublicKey, receiverPassCode);
    }

    public sendPaymentRequest = async (receiverVirtualAddress: string, paymentRequest: IPaymentRequest): Promise<void> => {
        // Resolve the public key of the receiver via nameservice
        await this.loginUsingPayIDClaim(receiverVirtualAddress);
        // let receiverPublicKey: string;
        // try {
        //     receiverPublicKey = await this._nameservice.resolveName(receiverVirtualAddress)
        //     log.info(`Resolved public key of ${receiverVirtualAddress}: ${receiverPublicKey}`)
        // } catch {
        //     let errorMsg = `Receiver is not registered as blockstack id`
        //     log.error(errorMsg)
        //     throw (errorMsg)
        // }


        // Initialise the DataConnection for sending the request
        // let receiverPasscode = passcode || prompt("Receiver passcode")

        // Publish the Payment Request to the receiver topic
        let payload: Message = {format: "openpay_v1", type: PubSubMessageType.payment, id: String(Date.now()), payload: paymentRequest};
        this._pubsub.publishMsg(receiverVirtualAddress, payload)
    }
}
