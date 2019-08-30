import Peer from "peerjs";
import { IPaymentRequest, IPayIDClaim, getLogger } from "..";
import { Encryption, LocalStorage, StorageService, TokenController } from ".";
import { EventEmitter } from "eventemitter3";

let log = getLogger(__filename)

// Pubsub service abstraction

export interface IPubSubServiceOptions {
    storage: StorageService
    encryption: typeof Encryption
}

export abstract class PubSubService extends EventEmitter {
    protected _options: IPubSubServiceOptions

    protected _storage: StorageService
    protected _encryption: typeof Encryption

    constructor(_options: IPubSubServiceOptions) {
        super()
        this._options = Object.assign({}, _options)
        // TODO: need to validate the options
        
        this._storage =  this._options.storage || new LocalStorage()
        this._encryption = this._options.encryption || Encryption
    }

    abstract isActive = (): boolean => false
    abstract isListening = (): boolean => false
    abstract publishMsg = async (payIDClaim: IPayIDClaim, topic: string, publicKey: string, payload: JSON, encryptionKey: string): Promise<void> => {}
    abstract registerTopic = (payIDClaim: IPayIDClaim, privateKey: string, topic?: string, dataCallback?: (requestObj: JSON) => void): void => {}

}

// PeerJS pubsub service implementation

const iceConfig = {
    iceServers: [
        {url:'stun:stun01.sipphone.com'},
        {url:'stun:stun.ekiga.net'},
        {url:'stun:stun.fwdnet.net'},
        {url:'stun:stun.ideasip.com'},
        {url:'stun:stun.iptel.org'},
        {url:'stun:stun.rixtelecom.se'},
        {url:'stun:stun.schlund.de'},
        {url:'stun:stun.l.google.com:19302'},
        {url:'stun:stun1.l.google.com:19302'},
        {url:'stun:stun2.l.google.com:19302'},
        {url:'stun:stun3.l.google.com:19302'},
        {url:'stun:stun4.l.google.com:19302'},
        {url:'stun:stunserver.org'},
        {url:'stun:stun.softjoys.com'},
        {url:'stun:stun.voiparound.com'},
        {url:'stun:stun.voipbuster.com'},
        {url:'stun:stun.voipstunt.com'},
        {url:'stun:stun.voxgratia.org'},
        {url:'stun:stun.xten.com'},
        {
            url: 'turn:numb.viagenie.ca',
            credential: 'muazkh',
            username: 'webrtc@live.com'
        },
        {
            url: 'turn:192.158.29.39:3478?transport=udp',
            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            username: '28224511:1379330808'
        },
        {
            url: 'turn:192.158.29.39:3478?transport=tcp',
            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            username: '28224511:1379330808'
        }
    ]
}

export class PeerJSService extends PubSubService {
    // TODO: fix the peerjs-server host
    private _peerServerCred = {key: "peerjs", secure: false, host: "localhost", port: 9090, config: iceConfig}
    private _peer: Peer

    constructor(_options: IPubSubServiceOptions) {
        super(_options)
        log.info(`Using PeerJSService for pubsub communication`)
    }

    private async _initialisePeer(payIDClaim: IPayIDClaim, options?: { passcode: string, privateKey: string }, dataCallback?: (requestObj: JSON) => void): Promise<boolean> {
        Object.assign(options || {} , {generateAccessToken: TokenController.generateAccessToken})
        const promise: Promise<boolean> = new Promise(async (resolve, reject) => {
            // Instantiate a messaging peer/node instance
            let peerId = await this._generatePeerId(payIDClaim.virtualAddress, payIDClaim.passcode)
            let peer = new Peer(peerId, Object.assign(this._peerServerCred, {decryptionPayload: options}))
            peer.on('open', id => log.info(`PeerJS id: ${id}`))
            peer.on('connection', dc => this._registerDataCallbacks(dc, options, dataCallback))
            peer.on('disconnected', () => this._peer = undefined)
            peer.on('error', (err) => {throw(err)})
            peer.on('close', () => this._peer = undefined)
            this._peer = peer

            peer.on('open', () => resolve(true))
        })
        return promise

    }

    private async _generatePeerId(virtualAddress: string, passcode: string): Promise<string> {
        return this._encryption.digest(`${virtualAddress}#${passcode}`)
    }

    private _registerDataCallbacks = (dataConnection: Peer.DataConnection, options: {privateKey?: string} = {}, dataCallback?: (requestObj: JSON) => void): void => {
        dataConnection.on('open', () => {
            console.log(`New peer connection ${dataConnection.peer}`)
            dataConnection.send("ping")
        })
        dataConnection.on('data', async data => {      
            // Respond to the ping
            if (data == "ping" || data == "pong") {
                console.log(`${dataConnection.peer}: ${data}`)
                if (data == "ping") dataConnection.send("pong")
            }
            
            // Try parsing the ecrypted JSON data
            else {
                // Check for the validity of the messages on wallet side (ownership of privatekey)
                if (options.privateKey) {
                    log.debug(`Encrypted validity of dataConnection: `, dataConnection.metadata.encryptedValidity)
                    // check for the validity of the dataConnection
                    if (!TokenController.checkValidity(options.privateKey, dataConnection.options._payload.ephemeralPublicKey, dataConnection.metadata.encryptedValidity)) throw (`Validity of the dataConnection has expired!`)
                }
                
                let decryptedJSON

                // Try to decrypt the data received. Ignore on not able to decrypt with the passcode
                try {
                    decryptedJSON = await this._encryption.decryptJSON(data.encBuffer, data.iv, dataConnection.options.encryptionPayload.encryptionToken)
                } catch (err) {
                    console.log(`Data from ${dataConnection.peer} could not be decrypted`)
                    return
                }
                
                
                // Parse openpay_v1 
                if (decryptedJSON.format == "openpay_v1") {
                    console.log(`${dataConnection.peer}:`, decryptedJSON)
                    this.emit('request', decryptedJSON)
                    if (dataCallback) dataCallback(decryptedJSON)
                } 

                else {
                    throw `Unknown msg format ${dataConnection.peer}: ${data}`
                }
            }

        })
    }


    private async _connectToPeer(payIDClaim: IPayIDClaim, peerVirtualAddress: string, receiverPublicKey: string, peerPasscode: string): Promise<Peer.DataConnection> {        
        // todo: validate to reconnect the existing peer object (in disconnect mode)
        if (!this._peer) await this._initialisePeer(payIDClaim).then(console.log)

        let peerIdentifier = await this._generatePeerId(peerVirtualAddress, peerPasscode)

        // Generate the accessToken using the TokenController (External UI JOB)
        let accessTokenData = TokenController.generateAccessToken(peerPasscode, receiverPublicKey)
        let encryptionPayload = {
            encryptionToken: accessTokenData.accessToken,
            ephemeralPublicKey: accessTokenData.ephemeralPublicKey,
            ivHex: accessTokenData.iv
        }
        let encryptedValidity = accessTokenData.encryptedValidity
        log.info(`Token details to be saved by services would be: `, Buffer.from(JSON.stringify({encryptionPayload, encryptedValidity})).toString('base64'))


        let dataConnection: Peer.DataConnection = this._peer.connect(peerIdentifier, { label: "openpay", encryptionPayload, metadata: {encryptedValidity: encryptedValidity}})
        this._registerDataCallbacks(dataConnection)
        return dataConnection
    }

    private async _sendPaymentRequest(payIDClaim: IPayIDClaim, receiverVirtualAddress: string, receiverPublicKey: string, paymentRequest: IPaymentRequest, passcode?: string): Promise<void> {        
        // Initialise the DataConnection for sending the request
        let receiverPasscode = passcode || prompt("Receiver passcode")
        let dataConnection = await this._connectToPeer(payIDClaim, receiverVirtualAddress, receiverPublicKey, receiverPasscode)
        // Send the Payment Request
        paymentRequest = Object.assign(paymentRequest, {format: "openpay_v1", encryptedValidity: dataConnection.metadata.encryptedValidity})
        let encryptedPaymentRequest: JSON = await this._encryption.encryptJSON(paymentRequest, dataConnection.options.encryptionPayload.encryptionToken)
        console.log("Encrypted Payment Request", encryptedPaymentRequest)
        dataConnection.on('open', () => {dataConnection.send(encryptedPaymentRequest)})
    }


    public isActive = (): boolean => {
        if (!this._peer) return false
        return Boolean(this._peer['open'])
    }

    public isListening = (): boolean => {
        if (!this._peer) return false
        let liveConnections = Object.keys(this._peer.connections)
            .map(peer => this._peer.connections[peer].map(conn => conn.open).filter(val => Boolean(val)))
            .filter((peer: any) => peer.length > 0)
        return liveConnections.length > 0 ? true : false
    }

    public publishMsg = async (payIDClaim: IPayIDClaim, topic: string, receiverPublicKey: string, payload: JSON, encryptionKey: string): Promise<void> => {
        await this._sendPaymentRequest(payIDClaim, topic, receiverPublicKey, payload, encryptionKey)
    }

    public registerTopic = async (payIDClaim: IPayIDClaim, decryptionPrivateKey: string, topic?: string, dataCallback?: (requestObj: JSON) => void): Promise<void> => {
        await this._initialisePeer(payIDClaim, { passcode: payIDClaim.passcode, privateKey: decryptionPrivateKey }, dataCallback).then(console.log)
    }
    
}