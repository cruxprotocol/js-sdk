import { EventEmitter } from "eventemitter3";
import 'regenerator-runtime/runtime'

import { 
    StorageService, LocalStorage, 
    Encryption, 
    PubSubService, PeerJSService,
    NameService, BlockstackService 
} from "./packages";


// TODO: Implement classes enforcing the interfaces
export interface IPayIDClaim {
    virtualAddress: string
    passcode: string
    privKey: string
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
    }

    public hasPayIDClaim = (): boolean =>  {
        return Boolean(this._payIDClaim)
    }

    public getPayIDClaim = (): IPayIDClaim => {
        return this._payIDClaim
    }

    public addPayIDClaim = (virtualAddress: string, passcode: string): void => {
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

    private _setPayIDClaim = (payIDClaim: IPayIDClaim): void => {
        this._payIDClaim = payIDClaim
    }

    public isActive = () => this._pubsub.isActive()

    public isListening = () => this._pubsub.isListening()


    // NameService specific methods

}



// Wallets specific SDK code
export class OpenPayWallet extends OpenPayPeer {

    constructor(_options: IOpenPayPeerOptions) {
        super(_options);
        
    }

    public activateListener = async (dataCallback?: (requestObj: JSON) => void): Promise<void> => {
        if (!this._payIDClaim) throw ("Need PayIDClaim setup!")
        await this._pubsub.registerTopic(this._payIDClaim, undefined, (dataObj: JSON) => {
            this.emit('request', dataObj)
            if (dataCallback) dataCallback(dataObj)
        })
    }
}




// Services specific SDK code
export class OpenPayService extends OpenPayPeer {

    constructor(_options: IOpenPayPeerOptions) {
        super(_options);
        
    }

    public sendPaymentRequest = async (receiverVirtualAddress: string, paymentRequest: IPaymentRequest, passcode?: string): Promise<void> => {
        // Initialise the DataConnection for sending the request
        let receiverPasscode = passcode || prompt("Receiver passcode")

        // Publish the Payment Request to the receiver topic
        paymentRequest = Object.assign(paymentRequest, {format: "openpay_v1"})

        this._pubsub.publishMsg(this._payIDClaim, receiverVirtualAddress, paymentRequest, receiverPasscode)
    }
}