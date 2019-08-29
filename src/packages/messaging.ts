import Peer from "peerjs";
import { IPaymentRequest, IPayIDClaim, getLogger, PubSubMessage, Errors, PubSubMessageType, IPaymentAck, Ack } from "..";
import { Encryption, LocalStorage, StorageService } from ".";
import { EventEmitter } from "eventemitter3";
import { resolve } from "url";

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
    abstract publishMsg = async (topic: string, payload: PubSubMessage, payIDClaim: IPayIDClaim): Promise<void> => {}
    abstract registerTopic = (payIDClaim: IPayIDClaim, privateKey: string, topic?: string, dataCallback?: (requestObj: JSON) => void): void => {}
    abstract connectToPeer = async (payIDClaim: IPayIDClaim, receiverVirtualAddress: string, receiverPublicKey: string, receiverPasscode: string): Promise<void> => {}
    abstract getConnectionForVirtualAddress = (virtualAddress: string): string => {return ''}
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
    private _peerServerCred = {key: "peerjs", secure: true, host: "157.230.199.143", port: 9090, config: iceConfig}
    private _peer: Peer
    private _loggedInWithPayIDClaim = {}

    constructor(_options: IPubSubServiceOptions) {
        super(_options)
        log.info(`Using PeerJSService for pubsub communication`)
    }

    private async _initialisePeer(payIDClaim, options: { publicKey?: string, privateKey?: string }, dataCallback?: (requestObj: JSON) => void): Promise<boolean> {
        if (!options.publicKey && !options.privateKey) throw (`Need either privateKey or publicKey to initialise the peer.`)
        const promise: Promise<boolean> = new Promise(async (resolve, reject) => {
            // Instantiate a messaging peer/node instance
            let peerId = await this._generatePeerId(payIDClaim.virtualAddress, payIDClaim.passcode)
            let peer = new Peer(peerId, Object.assign(this._peerServerCred, options))
            peer.on('open', id => log.info(`PeerJS id: ${id}`))
            peer.on('connection', dc => {
                this._registerDataCallbacks(payIDClaim, dc, dataCallback)
                this.setConnectionForVirtualAddress(dc.peer, dc);
            })
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

    private _registerDataCallbacks = (payIDClaim: IPayIDClaim, dataConnection: Peer.DataConnection, dataCallback?: (requestObj: JSON) => void): void => {
        dataConnection.on('data', async data => {      
            // Respond to the ping
            if (data == "ping" || data == "pong") {
                // console.log(`${dataConnection.peer}: ${data}`)
                // if (data == "ping") dataConnection.send("pong")
            }
            
            // Try parsing the ecrypted JSON data
            else {
                let decryptedJSON

                // Try to decrypt the data received. Ignore on not able to decrypt with the passcode
                try {
                    decryptedJSON = await this._encryption.decryptJSON(data.encBuffer, data.iv, payIDClaim.passcode);

                } catch (err) {
                    console.log(`Data from ${dataConnection.peer} could not be decrypted`)
                    return
                }
                
                
                // Parse openpay_v1 
                if (decryptedJSON.format == "openpay_v1") {
                    if (decryptedJSON.type == PubSubMessageType.ack){
                        log.info(`ack recieved from ${dataConnection.peer} for id ${decryptedJSON.payload.ackid}, message ${decryptedJSON}`)
                        this.emit('ack', decryptedJSON)
                    }
                    else if(decryptedJSON.type == PubSubMessageType.payment){
                        log.info(`payment recieved from ${dataConnection.peer} id ${decryptedJSON.id}, message ${decryptedJSON}`)
                        let ackPayment: Ack = {format: "openpay_v1", type: PubSubMessageType.ack, id: String(Date.now()), payload: {ackid: decryptedJSON.id, request: decryptedJSON}}; 
                        let encryptedPaymentRequest: JSON = await this._encryption.encryptJSON(ackPayment,  payIDClaim.passcode);        
                        dataConnection.send(encryptedPaymentRequest);
                        this.emit('request', decryptedJSON)
                        if (dataCallback) dataCallback(decryptedJSON)
                    }
                    else{
                        log.info(`unknown message ${decryptedJSON}, ignoring it`)
                    }
                } 

                else {
                    throw `Unknown msg format ${dataConnection.peer}: ${data}`
                }
            }

        })

        dataConnection.on('close', () => {
            log.info(`data connection closed for peer:- ${dataConnection.peer}`);
            delete this._loggedInWithPayIDClaim[dataConnection.peer];
        })
        dataConnection.on('error', error => {
            this.emit('error', {code: Errors.data_channel, msg: String(error)});
        })
    }

    private _connectDC = (peerIdentifier: string) => {
        const promise: Promise<boolean> = new Promise(async (resolve, reject) => {
            let dataConnection: Peer.DataConnection = this._peer.connect(peerIdentifier, {label: "openpay"})
            dataConnection.on('open', () => {
                console.log(`data channel open state with peer:- ${peerIdentifier}`);
                resolve(dataConnection);
            });
        });
        return promise
    }


    private async _connectToPeer(payIDClaim: IPayIDClaim, peerVirtualAddress: string, receiverPublicKey: string, peerPasscode: string): Promise<Peer.DataConnection> {        
        // todo: validate to reconnect the existing peer object (in disconnect mode)
        if (!this._peer) await this._initialisePeer(payIDClaim, { publicKey: receiverPublicKey }).then(console.log)
        let peerIdentifier = await this._generatePeerId(peerVirtualAddress, peerPasscode)
        let dataConnection: Peer.DataConnection = await this._connectDC(peerIdentifier);
        console.log(`dataConnection in connect to virtual address ${peerVirtualAddress} is ${dataConnection}`)
        this.setConnectionForVirtualAddress(peerVirtualAddress, dataConnection);
        this._registerDataCallbacks(payIDClaim, dataConnection)
        return dataConnection
    }

    private async _sendPaymentRequest(receiverVirtualAddress: string, paymentRequest: IPaymentRequest): Promise<void> {        
        // // Initialise the DataConnection for sending the request
        // let receiverPasscode = passcode || prompt("Receiver passcode")

        // // Send the Payment Request
        // paymentRequest = Object.assign(paymentRequest, {format: "openpay_v1"})

        // let dataConnection = await this._connectToPeer(payIDClaim, receiverVirtualAddress, receiverPublicKey, receiverPasscode)
        // let dataConnection = this.getConnectionForVirtualAddress(receiverVirtualAddress);
        // if(!dataConnection){
        //     log.info(`no existing login found for ${receiverVirtualAddress}, please login using your payIDClaim and try again..`);
        //     throw(`no existing login found for ${receiverVirtualAddress}, please login using your payIDClaim and try again..`);
        // }
        // let encryptedPaymentRequest: JSON = await this._encryption.encryptJSON(paymentRequest, receiverPasscode)
        // console.log("Encrypted Payment Request", encryptedPaymentRequest)
        // dataConnection.on('open', () => {dataConnection.send(encryptedPaymentRequest)})
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

    public publishMsg = async (topic: string, payload: PubSubMessage, payIDClaim: IPayIDClaim): Promise<void> => {
        // await this._sendPaymentRequest(topic, payload)
        log.info(`sending message on topic :- ${topic} ${payload}`)
        let dataConnection = this.getConnectionForVirtualAddress(topic); // reciever virtual address
        if(!dataConnection){
            throw(`no existing login found for ${topic}, please login using your payIDClaim and try again.d.`);
        }
        let receiverPasscode = payIDClaim.passcode;
        let encryptedPaymentRequest: JSON = await this._encryption.encryptJSON(payload, receiverPasscode);
        dataConnection.send(encryptedPaymentRequest);

    }

    public registerTopic = async (payIDClaim: IPayIDClaim, decryptionPrivateKey: string, topic?: string, dataCallback?: (requestObj: JSON) => void): Promise<void> => {
        await this._initialisePeer(payIDClaim, { privateKey: decryptionPrivateKey }, dataCallback).then(console.log)
    }

    public connectToPeer = async (payIDClaim: IPayIDClaim, receiverVirtualAddress: string, receiverPublicKey: string, receiverPasscode: string): Promise<void> => {
        await this._connectToPeer(payIDClaim, receiverVirtualAddress, receiverPublicKey, receiverPasscode);
    }

    public getConnectionForVirtualAddress = (virtualAddress: string) => {
        return this._loggedInWithPayIDClaim[virtualAddress];
    }

    public setConnectionForVirtualAddress = (virtualAddress: string, dataConnection: any) => {

        this._loggedInWithPayIDClaim[virtualAddress] = dataConnection;
    }
    
}