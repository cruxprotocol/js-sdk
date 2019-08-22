import { EventEmitter } from "eventemitter3";
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

export interface IPaymentRequest {
    format: string
    currency: string
    fromAddress?: IAddress
    toAddress: IAddress
    value: number
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
        this._nameservice = this._options.nameservice || new BlockstackService()

        if (this._hasPayIDClaimStored) {
            let payIDClaim = this._storage.getJSON('payIDClaim')
            this._setPayIDClaim(payIDClaim)
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

}



// Wallets specific SDK code
export class OpenPayWallet extends OpenPayPeer {

    constructor(_options: IOpenPayPeerOptions) {
        super(_options);
        log.info(`OpenPayWallet Initialised`)
    }

    public activateListener = async (dataCallback?: (requestObj: JSON) => void): Promise<void> => {
        if (!this._payIDClaim) throw ("Need PayIDClaim setup!")
        await this._pubsub.registerTopic(this._payIDClaim, undefined, (dataObj: JSON) => {
            this.emit('request', dataObj)
            if (dataCallback) dataCallback(dataObj)
        })
    }
    

    // NameService specific methods

    public addPayIDClaim = async (virtualAddress: string, passcode: string): Promise<void> => {
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

    }

}




// Services specific SDK code
export class OpenPayService extends OpenPayPeer {

    constructor(_options: IOpenPayPeerOptions) {
        super(_options);
        log.info(`OpenPayService Initialised`)
    }

    public sendPaymentRequest = async (receiverVirtualAddress: string, paymentRequest: IPaymentRequest, passcode?: string): Promise<void> => {
        // Resolve the public key of the receiver via nameservice
        try {
            let receiverPublicKey = await this._nameservice.resolveName(receiverVirtualAddress)
            console.log(receiverPublicKey)
        } catch {
            console.log(`Receiver is probably not a blockstack id owner`)
        }
        

        // Initialise the DataConnection for sending the request
        let receiverPasscode = passcode || prompt("Receiver passcode")

        // Publish the Payment Request to the receiver topic
        paymentRequest = Object.assign(paymentRequest, {format: "openpay_v1"})

        this._pubsub.publishMsg(this._payIDClaim, receiverVirtualAddress, paymentRequest, receiverPasscode)
    }
}