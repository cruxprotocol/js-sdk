import { EventEmitter } from "eventemitter3";
import Peer from "peerjs";


let noop = () => {}


export interface IPayIDClaim {
    virtualAddress: string
    passcode: string
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


export class Storage {
    private static storage = sessionStorage || localStorage

    static setItem = (key: string, value: string): void => {
        Storage.storage.setItem(key, value)
    }

    static getItem = (key: string): string => {
        return Storage.storage.getItem(key)
    }

    static setJSON = (key: string, jsonObj: JSON): void => {
        let objString = JSON.stringify(jsonObj)
        Storage.storage.setItem(key, objString)
    }

    static getJSON = (key: string): JSON => {
        let objString = Storage.storage.getItem(key)
        return JSON.parse(objString)
    }
}

export class Encryption {
    
    static digest = async (str: string): Promise<string> => {
        let buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str))
        return Array.prototype.map.call(new Uint8Array(buffer), x=>(('00'+x.toString(16)).slice(-2))).join('')
    }

    static encryptJSON = async (jsonObj: JSON, password: string): Promise<JSON> => {
        let plainText = JSON.stringify(jsonObj)
        return Encryption.encryptText(plainText, password)
    }
    
    static decryptJSON = async (ctBuffer: ArrayBuffer, iv: Uint8Array, password: string): Promise<JSON> => {
        let JSONString = await Encryption.decryptText(ctBuffer, iv, password)
        return JSON.parse(JSONString)
    }

    static encryptText = async (plainText: string, password: string): Promise<JSON> => {
        const ptUtf8 = new TextEncoder().encode(plainText);

        const pwUtf8 = new TextEncoder().encode(password);
        const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8); 

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const alg = { name: 'AES-GCM', iv: iv };
        const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['encrypt']);

        return { iv, encBuffer: await crypto.subtle.encrypt(alg, key, ptUtf8) };
    }

    static decryptText = async (ctBuffer: ArrayBuffer, iv: Uint8Array, password: string): Promise<string> => {
        const pwUtf8 = new TextEncoder().encode(password);
        const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);

        const alg = { name: 'AES-GCM', iv: iv };
        const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['decrypt']);

        const ptBuffer = await crypto.subtle.decrypt(alg, key, ctBuffer);

        const plaintext = new TextDecoder().decode(ptBuffer);

        return plaintext;
    }
}


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


class OpenPayPeer extends EventEmitter {
    private _payIDClaim: IPayIDClaim
    private _peerServerCred = {key: "peerjs", secure: true, host: "157.230.199.143", port: 9090, config: iceConfig}
    private _peer: Peer

    /**
     *
     */
    constructor() {
        super();
        if (this._hasPayIDClaimStored) {
            let payIDClaim = Storage.getJSON('payIDClaim')
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
        Storage.setJSON('payIDClaim', payIDClaim)
        this._setPayIDClaim(payIDClaim)
        
    }

    private _hasPayIDClaimStored = (): boolean => {
        return Boolean(Storage.getJSON('payIDClaim'))
    }

    private _setPayIDClaim = (payIDClaim: IPayIDClaim): void => {
        this._payIDClaim = payIDClaim
    }

    private async _initialisePeer(): Promise<boolean> {
        const promise: Promise<boolean> = new Promise(async (resolve, reject) => {
            // Instantiate a messaging peer/node instance
            let peerId = await this._generatePeerId(this._payIDClaim.virtualAddress, this._payIDClaim.passcode)
            let peer = new Peer(peerId, this._peerServerCred)
            peer.on('open', console.log)
            peer.on('connection', this._registerDataCallbacks)
            peer.on('disconnected', () => this._peer = undefined)
            peer.on('error', (err) => {throw(err)})
            peer.on('close', () => this._peer = undefined)
            this._peer = peer

            peer.on('open', () => resolve(true))
        })
        return promise

    }

    private async _generatePeerId(virtualAddress: string, passcode: string): Promise<string> {
        return Encryption.digest(`${virtualAddress}#${passcode}`)
    }

    private _registerDataCallbacks = (dataConnection: Peer.DataConnection): void => {
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
                let decryptedJSON

                // Try to decrypt the data received. Ignore on not able to decrypt with the passcode
                try {
                    decryptedJSON = await Encryption.decryptJSON(data.encBuffer, data.iv, this._payIDClaim.passcode)
                } catch (err) {
                    console.log(`Data from ${dataConnection.peer} could not be decrypted`)
                    return
                }
                
                
                // Parse openpay_v1 
                if (decryptedJSON.format == "openpay_v1") {
                    console.log(`${dataConnection.peer}:`, decryptedJSON)
                    this.emit('request', decryptedJSON)
                    // document.getElementById('data').innerHTML += `From ${dataConnection.peer}: ${JSON.stringify(decryptedJSON, undefined, 4)}\n`
                } 

                else {
                    throw `Unknown msg format ${dataConnection.peer}: ${data}`
                }
            }

        })
    }

    public async activateListener(): Promise<void> {
        if (!this._payIDClaim) throw ("Need PayIDClaim setup!")
        await this._initialisePeer().then(console.log)
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

    private async _connectToPeer(peerVirtualAddress: string, peerPasscode: string): Promise<Peer.DataConnection> {        
        // todo: validate to reconnect the existing peer object (in disconnect mode)
        if (!this._peer) await this._initialisePeer().then(console.log)

        let peerIdentifier = await this._generatePeerId(peerVirtualAddress, peerPasscode)

        let dataConnection: Peer.DataConnection = await this._peer.connect(peerIdentifier, {label: "openpay"})
        this._registerDataCallbacks(dataConnection)
        return dataConnection
    }

    public async sendPaymentRequest(receiverVirtualAddress: string, paymentRequest: IPaymentRequest, passcode?: string): Promise<void> {        
        // Initialise the DataConnection for sending the request
        let receiverPasscode = passcode || prompt("Receiver passcode")
        let dataConnection = await this._connectToPeer(receiverVirtualAddress, receiverPasscode)

        // Send the Payment Request
        paymentRequest = Object.assign(paymentRequest, {format: "openpay_v1"})
        
        let encryptedPaymentRequest: JSON = await Encryption.encryptJSON(paymentRequest, receiverPasscode)
        console.log("Encrypted Payment Request", encryptedPaymentRequest)
        dataConnection.on('open', () => {dataConnection.send(encryptedPaymentRequest)})
    }
}















export class OpenPayWallet extends OpenPayPeer {
    /**
     *
     */
    constructor() {
        super();
        
    }
}

export class OpenPayService extends OpenPayPeer {
    /**
     *
     */
    constructor() {
        super();
        
    }
}
