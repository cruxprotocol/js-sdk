
import { makeECPrivateKey, getPublicKeyFromPrivate, publicKeyToAddress, connectToGaiaHub, uploadToGaiaHub, default as blockstack, wrapProfileToken, Person, BlockstackWallet, lookupProfile, verifyProfileToken, isManifestUriValid} from "blockstack";
import * as bitcoin from "bitcoinjs-lib";
import request from "request";
import { TokenSigner, SECP256K1Client } from "jsontokens";
import { getLogger, IAddress, IAddressMapping, AddressMapping } from "..";
import {Decoder, object, string, optional} from '@mojotech/json-type-validation'

let log = getLogger(__filename)

// NameService abstraction

export interface IIdentityClaim {
    secret: string
}

export abstract class NameService {

    constructor(options: any = {}) {}

    abstract generateIdentity = (): IIdentityClaim => {return {secret: null}}
    abstract restoreIdentity = (options?: any): void => {}
    abstract getDecryptionKey = async (): Promise<string> => {return}
    abstract getNameAvailability = async (name: string): Promise<boolean> => {return false}
    abstract registerName = async (name: string): Promise<string> => {return}
    // TODO: need to respond with boolean
    abstract getRegistrationStatus = (): Promise<any> => {return}
    abstract resolveName = async (name: string, options?: JSON): Promise<string> => {return "pubkey"}
    abstract getAddressMapping = async (name: string, options?: JSON): Promise<IAddressMapping> => {return}
    abstract putAddressMapping = async (addressMapping: IAddressMapping): Promise<boolean> => {return false}

    // TODO: Implement methods to add/update address mapping (Gamma usecase)

}





// Blockstack Nameservice implementation
export interface IBitcoinKeyPair {
    privKey: string
    pubKey: string
    address: string
}

export interface IBlockstackServiceOptions {
    domain: string
    gaiaHub: string
    subdomainRegistrar: string
}

export enum SubdomainRegistrationStatus {
    NONE,
    INIT = "INIT",
    PENDING = "PENDING",
    DONE = "DONE"
}

let defaultBNSConfig: IBlockstackServiceOptions = {
    domain: 'devcoinswitch.id', 
    gaiaHub: 'https://hub.blockstack.org',
    subdomainRegistrar: 'https://registrar.coinswitch.co:3000'
}

export class BlockstackService extends NameService {
    // temporary
    public blockstack = blockstack
    public bitcoin = bitcoin

    private _domain: string
    private _gaiaHub: string
    private _subdomainRegistrar: string

    private _mnemonic: string
    private _identityKeyPair: IBitcoinKeyPair
    private _subdomain: string

    constructor(options: any = {}) {
        super(options);
        let _options: IBlockstackServiceOptions = Object.assign(options, defaultBNSConfig)
        
        this._domain = _options.domain
        this._gaiaHub = _options.gaiaHub
        this._subdomainRegistrar = _options.subdomainRegistrar
    }

    private _generateMnemonic = (): string => {
        return BlockstackWallet.generateMnemonic()
    }

    private _setMnemonic = (mnemonic: string): void => {
        // TODO: validate the mnemonic format
        this._mnemonic = mnemonic
    }

    private _generateIdentityKeyPair = async (): Promise<void> => {
        // TODO: need to use passcode encryption
        let encryptedMnemonic = await BlockstackWallet.encryptMnemonic(this._mnemonic, 'temp')
        let wallet = await BlockstackWallet.fromEncryptedMnemonic(encryptedMnemonic, 'temp')
        // Using the first identity key pair for now
        // TODO: need to validate the name registration on the address if already available
        let { address, key, keyID} = wallet.getIdentityKeyPair(0)   
        let identityKeyPair: IBitcoinKeyPair = {
            address: address,
            privKey: key,
            pubKey: keyID
        }
        this._identityKeyPair = identityKeyPair
    }

    public getDecryptionKey = async () => {
        if (!this._identityKeyPair) {
            await this._generateIdentityKeyPair()
        }
        let decryptionKey = (this._identityKeyPair.privKey.substr(-2) == "01" && this._identityKeyPair.privKey.length >= 66) ? this._identityKeyPair.privKey.slice(0, -2) : this._identityKeyPair.privKey
        return decryptionKey
    }

    public restoreIdentity = (options?: any): void => {
        if (!options || !options['identitySecret']) throw (`Require mnemonic for restoring the identity`)
        this._setMnemonic(options['identitySecret'])
        this._generateIdentityKeyPair()
    }

    public generateIdentity = (): IIdentityClaim => {
        let newMnemonic = this._generateMnemonic()
        console.log(newMnemonic)
        alert(`Your new mnemonic backing your identity is \n ${newMnemonic}`)
        this._mnemonic = newMnemonic
        return { secret: this._mnemonic }
    }

    private _generateKeyPair = (): IBitcoinKeyPair => {
        
        let privKey = makeECPrivateKey()
        let pubKey = getPublicKeyFromPrivate(privKey)
        let address = publicKeyToAddress(pubKey)

        let bitcoinKeyPair: IBitcoinKeyPair = {privKey, pubKey, address}

        return bitcoinKeyPair
    }

    private _getPubKey = (privKey: string): string => {
        return getPublicKeyFromPrivate(privKey)
    }

    private _sanitizePrivKey = (privKey: string): string => {
        if (privKey.length == 66 && privKey.slice(64) === '01') {
            privKey = privKey.slice(0, 64);
        }
        return privKey
    }

    private _uploadProfileInfo = (privKey: string) => {
        // TODO: validate the privateKey format and convert
        privKey = this._sanitizePrivKey(privKey)

        const promise: Promise<boolean> = new Promise(async (resolve, reject) => {
            let hubUrl = this._gaiaHub
            connectToGaiaHub(hubUrl, privKey)
                .then(hubConfig => {
                    let sampleProfileObj = {
                        "@context": "http://schema.org/",
                        "@type": "Person"
                    }
                    let person = new Person(sampleProfileObj)
                    let token = person.toToken(privKey)
                    log.debug(token)
                    let tokenFile = [wrapProfileToken(token)]
                    log.debug(tokenFile)
                    uploadToGaiaHub('profile.json', JSON.stringify(tokenFile), hubConfig, "application/json")
                        .then(finalUrl => {
                            console.log(finalUrl)
                            resolve(true)
                        })
                })
        })
        return promise
    }

    private _addressMapToToken = (addressMap: IAddressMapping, privKey: string): string => {
        let addressMapObj = new AddressMapping(addressMap)
        const publicKey = SECP256K1Client.derivePublicKey(privKey)
        const tokenSigner = new TokenSigner("ES256K", privKey)
        const payload = {
            issuer: { publicKey },
            subject: { publicKey },
            claim: addressMapObj.toJSON()
        }
        let token = tokenSigner.sign(payload)
        return token
    }

    private _uploadAddressMapping = async (privKey: string, addressMap: IAddressMapping): Promise<boolean> => {
        // Fetch the existing addressMapping and merge the JSON before uploading
        // addressMap = Object.assign(await this.getAddressMapping(this._subdomain), addressMap)
        log.debug(`Merged addressMap: `, addressMap)       
        privKey = this._sanitizePrivKey(privKey)

        const promise: Promise<boolean> = new Promise(async (resolve, reject) => {
            let hubUrl = this._gaiaHub
            connectToGaiaHub(hubUrl, privKey)
                .then(hubConfig => {
                    let token = this._addressMapToToken(addressMap, privKey)
                    log.debug(token)
                    let tokenFile = [wrapProfileToken(token)]
                    log.debug(tokenFile)
                    uploadToGaiaHub('openpay.json', JSON.stringify(tokenFile), hubConfig, "application/json")
                        .then(finalUrl => {
                            log.debug(finalUrl)
                            resolve(true)
                        })
                })
                .catch(reject)
        })
        return promise
    }

    private _registerSubdomain = (name: string, bitcoinAddress: string): Promise<string> => {
        const promise: Promise<string> = new Promise(async (resolve, reject) => {
            var options = { 
                method: 'POST',
                baseUrl: this._subdomainRegistrar,
                url: '/register',
                headers: { 
                    'Content-Type': 'application/json'
                },
                // TODO: need to convert the gaia configURL into variable
                body: { 
                    zonefile: `$ORIGIN ${name}\n$TTL 3600\n_https._tcp URI 10 1 "https://gaia.blockstack.org/hub/${bitcoinAddress}/profile.json"\n`,
                    name: name,
                    owner_address: bitcoinAddress
                },
                json: true,
                strictSSL: false
            };
    
            request(options, function (error, response, body) {
                if (error) throw new Error(error)
                console.log(body)
                // TODO: resolve the promise to true on status: true
                if (body && body['status'] == true) {
                    resolve(name)
                }
                else {
                    reject(body)
                }
            })
        })
        
        return promise
    }

    public registerName = async (name: string): Promise<string> => {
        // Check for existing mnemonic
        if (!this._mnemonic) {
            // Generate new mnemonic if not available
            this.generateIdentity()
        }
        // Generate the Identity key pair
        await this._generateIdentityKeyPair()

        // Upload the profile.json file to the Gaia hub
        await this._uploadProfileInfo(this._identityKeyPair.privKey)
        
        // Register the subdomain with Coinswitch registrar service
        let registeredSubdomain = await this._registerSubdomain(name, this._identityKeyPair.address)
        this._subdomain = registeredSubdomain

        return `${this._subdomain}.${this._domain}`
    }

    public getRegistrationStatus = (): Promise<SubdomainRegistrationStatus> => {
        const promise: Promise<SubdomainRegistrationStatus> = new Promise(async (resolve, reject) => {
            if (!this._subdomain) throw (`No subdomain is registered`)
            var options = { 
                method: 'GET',
                baseUrl: this._subdomainRegistrar,
                url: `/status/${this._subdomain}`,
                json: true
            };
            log.debug("registration query params", options)
            request(options, function (error, response, body) {
                if (error) reject(error)
                log.debug(body)
                let status: SubdomainRegistrationStatus
                let rawStatus = body['status']
                switch (rawStatus) {
                    case "Subdomain not registered with this registrar":
                        status = SubdomainRegistrationStatus.NONE
                        break;
                    case rawStatus.includes('Your subdomain was registered in transaction') || "Subdomain is queued for update and should be announced within the next few blocks.":
                        status = SubdomainRegistrationStatus.PENDING
                        break;
                    case "Subdomain propagated":
                        status = SubdomainRegistrationStatus.DONE
                        break;
                    default:
                        status = SubdomainRegistrationStatus.NONE
                        break;
                }
                resolve(status)
            })
        })
        return promise
    }

    private _fetchNameDetails = (blockstackId: string): Promise<JSON> => {
        const promise: Promise<JSON> = new Promise(async (resolve, reject) => {
            var options = { 
                method: 'GET',
                baseUrl: 'https://core.blockstack.org',
                url: `/v1/names/${blockstackId}`,
                json: true
            };

            request(options, function (error, response, body) {
                if (error) throw new Error(error)
                resolve(body)
            })
        })
        return promise
    }

    public getNameAvailability = async (name: string): Promise<boolean> => {
        let nameData = await this._fetchNameDetails(name)
        return nameData['status'] == "available" ? true : false
    }

    public _getNamespaceArray = (name: string, domainFallback?: string): [string, string?, string?] => {
        log.debug(`_getNamespaceArray for ${name}`)
        // if (ankit.coinswitch.id)
        let subdomain: string, domain: string, namespace: string
        namespace = "id"
        if (name.substr(-3) == ".id") {
            let idArray = name.split('.').reverse()
            log.debug(idArray)
            domain = idArray[1]
            subdomain = idArray[2]
        } 
        // else (ankit)
        else {
            subdomain = name
            domain = domainFallback ? domainFallback.split('.').reverse()[1] : this._domain.split('.')[0]
        }
        return [namespace, domain, subdomain]
    }

    private _getBlockstackId = (name: string, domain?: string) => {
        let namespaceArray = this._getNamespaceArray(name, domain)
        log.debug(namespaceArray)
        let blockstackId = `${namespaceArray.reverse().join('.')}`
        return blockstackId
    }

    public resolveName = async (name: string, options = {}): Promise<string> => {
        let blockstackId = this._getBlockstackId(name, options['domain'])
        log.info(`Resolving blockstackId: ${blockstackId}`)

        let nameData = await this._fetchNameDetails(blockstackId)
        
        
        if (!nameData || nameData['status'] == "available") throw (`No name data availabe!`)
        let bitcoinAddress = nameData['address']
        log.debug(`ID owner: ${bitcoinAddress}`)
        log.debug(nameData)
        let zonefilePath = nameData['zonefile'].match(/(.+)https:\/\/(.+)\/profile.json/s)[2]
        let profileUrl = "https://" + zonefilePath + "/profile.json"
        const promise: Promise<string> = new Promise(async (resolve, reject) => {
            var options = { 
                method: 'GET',
                url: profileUrl,
                json: true
            };

            request(options, function (error, response, body) {
                if (error) throw new Error(error)
                let publicKey: string

                try {
                    publicKey = body[0].decodedToken.payload.subject.publicKey
                } catch {
                    throw (`Probably this id resolves to a domain registrar`)
                }
                
                let addressFromPub = publicKeyToAddress(publicKey)
                
                // validate the file integrity with the token signature
                try {
                    const decodedToken = verifyProfileToken(body[0].token, publicKey)
                } catch(e) {
                    console.log(e)
                }

                if (addressFromPub === bitcoinAddress) resolve (publicKey)
                else reject (`Invalid zonefile`)
            })
        })
        return promise
    }

    public putAddressMapping = async (addressMapping: IAddressMapping): Promise<boolean> => {
        const addressDecoder: Decoder<IAddress> = object({
            addressHash: string(),
            secIdentifier: optional(string())
        });
        const promise: Promise<boolean> = new Promise((resolve, reject) => {
            try {
                for ( let currency in addressMapping ) {
                    let addressObject: IAddress = addressDecoder.runWithException(addressMapping[currency])
                }
                this._uploadAddressMapping(this._identityKeyPair.privKey, addressMapping)
                    .then(bool => resolve(bool))
            } catch (e) {
                reject (e)
            }
        })
        return promise
    }

    public getAddressMapping = async (name: string, options = {}): Promise<IAddressMapping> => {
        let blockstackId = this._getBlockstackId(name, options['domain'])
        let pubKey = await this.resolveName(blockstackId, options)
        let nameData = await this._fetchNameDetails(blockstackId)
        log.debug(nameData)
        if (!nameData) throw (`No name data availabe!`)
        let bitcoinAddress = nameData['address']
        log.debug(`ID owner: ${bitcoinAddress}`)
        let profileUrl = "https://" + nameData['zonefile'].match(/(.+)https:\/\/(.+)\/profile.json/s)[2] + "/openpay.json"
        const promise: Promise<IAddressMapping> = new Promise(async (resolve, reject) => {
            var options = { 
                method: 'GET',
                url: profileUrl,
                json: true
            };

            request(options, function (error, response, body) {
                log.debug(`Response from openpay.json`, body)
                if (error) throw new Error(error)
                let addressMap: IAddressMapping

                try {
                    addressMap = body[0].decodedToken.payload.claim
                    log.debug(`Address map: `, addressMap)
                } catch (e) {
                    log.error(e)
                    // TODO: fix the error log
                    throw (`Probably this id resolves to a domain registrar`)
                }
                
                let addressFromPub = publicKeyToAddress(pubKey)
                
                // validate the file integrity with the token signature
                try {
                    const decodedToken = verifyProfileToken(body[0].token, pubKey)
                } catch(e) {
                    // TODO: validate the token properly after publishing the subject
                    log.error(e)
                }

                if (addressFromPub === bitcoinAddress) resolve (addressMap)
                else reject (`Invalid zonefile`)
            })
        })
        return promise
    }

}