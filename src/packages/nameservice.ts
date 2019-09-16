
import { makeECPrivateKey, getPublicKeyFromPrivate, publicKeyToAddress, connectToGaiaHub, uploadToGaiaHub, default as blockstack, wrapProfileToken, Person, BlockstackWallet, lookupProfile, verifyProfileToken, isManifestUriValid} from "blockstack";
import * as bitcoin from "bitcoinjs-lib";
import request from "request";
import { TokenSigner, SECP256K1Client } from "jsontokens";
import { getLogger, IAddress, IAddressMapping, AddressMapping } from "..";
import {Decoder, object, string, optional} from '@mojotech/json-type-validation'
import { deepStrictEqual, AssertionError } from "assert";
import { async, reject } from "q";
import { resolve } from "path";
import { err } from "@mojotech/json-type-validation/dist/types/result";

let log = getLogger(__filename)

// NameService abstraction

export interface IIdentityClaim {
    secrets: any
}

export abstract class NameService {

    constructor(options: any = {}) {}

    abstract generateIdentity = async (): Promise<IIdentityClaim> => {return { secrets: null }}
    abstract restoreIdentity = async (options?: any): Promise<IIdentityClaim> => {return { secrets: null }}
    abstract getDecryptionKey = async (identityClaim: IIdentityClaim): Promise<string> => {return}
    abstract getEncryptionKey = async (identityClaim: IIdentityClaim): Promise<string> => {return}
    abstract getNameAvailability = async (name: string): Promise<boolean> => {return false}
    abstract registerName = async (identityClaim: IIdentityClaim, name: string): Promise<string> => {return}
    // TODO: need to respond with boolean
    abstract getRegistrationStatus = (): Promise<any> => {return}
    abstract resolveName = async (name: string, options?: JSON): Promise<string> => {return "pubkey"}
    abstract getAddressMapping = async (name: string, options?: JSON): Promise<IAddressMapping> => {return}
    abstract putAddressMapping = async (identityClaim: IIdentityClaim, addressMapping: IAddressMapping): Promise<boolean> => {return false}
    abstract getGlobalAssetList = async (): Promise<object> => {return {}}
    abstract getClientAssetMapping = async (name: string): Promise<object> => {return {}}
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
    bnsNodes: string[]
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
    subdomainRegistrar: 'https://registrar.coinswitch.co:3000',
    bnsNodes: ['https://core.blockstack.org', 'https://bns.coinswitch.co']
}

export class BlockstackService extends NameService {
    // temporary
    public blockstack = blockstack
    public bitcoin = bitcoin
    
    public readonly type = 'blockstack'    

    private _domain: string
    private _gaiaHub: string
    private _subdomainRegistrar: string

    private _subdomain: string
    private _bnsNodes: string[]

    constructor(options: any = {}) {
        super(options);
        let _options: IBlockstackServiceOptions = Object.assign(options, defaultBNSConfig)
        
        this._domain = _options.domain
        this._gaiaHub = _options.gaiaHub
        this._subdomainRegistrar = _options.subdomainRegistrar
        this._bnsNodes = _options.bnsNodes
    }

    private _generateMnemonic = (): string => {
        return BlockstackWallet.generateMnemonic()
    }


    private _generateIdentityKeyPair = async (mnemonic: string): Promise<IBitcoinKeyPair> => {
        // TODO: need to use passcode encryption
        let encryptedMnemonic = await BlockstackWallet.encryptMnemonic(mnemonic, 'temp')
        let wallet = await BlockstackWallet.fromEncryptedMnemonic(encryptedMnemonic, 'temp')
        // Using the first identity key pair for now
        // TODO: need to validate the name registration on the address if already available
        let { address, key, keyID} = wallet.getIdentityKeyPair(0)   
        let identityKeyPair: IBitcoinKeyPair = {
            address: address,
            privKey: key,
            pubKey: keyID
        }
        return identityKeyPair
    }

    public getDecryptionKey = async (identityClaim: IIdentityClaim): Promise<string> => {
        let identityKeyPair: IBitcoinKeyPair
        
        if (!identityClaim.secrets.identityKeyPair) {
            identityKeyPair = await this._generateIdentityKeyPair(identityClaim.secrets.mnemonic)
        } 
        else {
            identityKeyPair = identityClaim.secrets.identityKeyPair
        }

        let decryptionKey = (identityKeyPair.privKey.substr(-2) == "01" && identityKeyPair.privKey.length >= 66) ? identityKeyPair.privKey.slice(0, -2) : identityKeyPair.privKey
        return decryptionKey
    }

    public getEncryptionKey = async (identityClaim: IIdentityClaim): Promise<string> => {
        let identityKeyPair: IBitcoinKeyPair
        
        if (!identityClaim.secrets.identityKeyPair) {
            identityKeyPair = await this._generateIdentityKeyPair(identityClaim.secrets.mnemonic)
        }
        else {
            identityKeyPair = identityClaim.secrets.identityKeyPair
        }

        let encryptionKey = identityKeyPair.pubKey
        return encryptionKey
    }

    public restoreIdentity = async (options?: any): Promise<IIdentityClaim> => {
        if (!options || !options['identitySecrets']) throw (`Require mnemonic for restoring the identity`)

        let mnemonic = options['identitySecrets']['mnemonic']
        let identityKeyPair

        // If identityKeypair is not stored locally, generate them using the mnemonic
        if (!options['identitySecrets']['identityKeyPair']) {
            identityKeyPair = await this._generateIdentityKeyPair(mnemonic)
        } 
        

        return {
            secrets: {
                mnemonic: mnemonic,
                identityKeyPair: identityKeyPair
            }
        }
        
    }

    public generateIdentity = async (): Promise<IIdentityClaim> => {
        let newMnemonic = this._generateMnemonic()
        log.debug(newMnemonic)
        log.warn(`Your new mnemonic backing your identity is: \n${newMnemonic}`)
        let identityKeyPair = await this._generateIdentityKeyPair(newMnemonic)
        return { 
            secrets: { 
                mnemonic: newMnemonic,
                identityKeyPair: identityKeyPair
            } 
        }
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

    private _generateTokenFileForContent(privateKey: string, content: any){
        const publicKey = SECP256K1Client.derivePublicKey(privateKey)
        const tokenSigner = new TokenSigner("ES256K", privateKey)
        const payload = {
            issuer: { publicKey },
            subject: { publicKey },
            claim: content
        }
        let token = tokenSigner.sign(payload)
        let tokenFile = [wrapProfileToken(token)]
        return tokenFile
    }

    public uploadContentToGaiaHub = async (filename: string, privKey: string, content: any, type="application/json"): Promise<String> => {
        let sanitizedPrivKey = this._sanitizePrivKey(privKey)
        let hubURL = this._gaiaHub
        const uploadPromise: Promise<String> = new Promise(async(resolve, reject) => {
            connectToGaiaHub(hubURL, sanitizedPrivKey).then(hubConfig => {
                let tokenFile = this._generateTokenFileForContent(sanitizedPrivKey, content)
                let contentToUpload: any = null
                if(type == "application/json"){
                    contentToUpload = JSON.stringify(tokenFile);
                }
                else{
                    throw `Unhandled content-type ${type}`
                }
                uploadToGaiaHub(filename, contentToUpload, hubConfig, type).then(finalURL => {
                    console.log(`finalUrl is ${finalURL}`);
                    resolve(finalURL)
                }).catch(error => {
                    reject(`unable to upload to gaiahub, ${error}`)
                });
            })
        });
        return uploadPromise;
    }

    public getContentFromGaiaHub = async(blockstackId: string, pubKey: string, filename: string, type="application/json"): Promise<any> => {
        let nameData = await this._fetchNameDetails(blockstackId)
        log.debug(nameData)
        if (!nameData) throw (`No name data availabe!`)
        let bitcoinAddress = nameData['address']
        log.debug(`ID owner: ${bitcoinAddress}`)
        let profileUrl = "https://" + nameData['zonefile'].match(/(.+)https:\/\/(.+)\/profile.json/s)[2] + "/" + filename;
        const getContentPromise: Promise<any> = new Promise(async (resolve, reject) => {
            var options = { 
                method: 'GET',
                url: profileUrl,
                json: true
            };

            request(options, function (error, response, body) {
                log.debug(`Response from openpay.json`, body)
                if (error) throw new Error(error)
                let content: string

				if (body.indexOf('BlobNotFound') > 0){
					resolve ("");
				} else {
					try {
                        content = body[0].decodedToken.payload.claim
                        if(!(type == "application/json")){
                            log.error(`unhandled content type`)
                            reject('invalid content type')
                        }
						log.debug(`Content:- `, content)
					} catch (e) {
						log.error(e)
						throw (`Probably this id resolves to a domain registrar`)
					}

					let addressFromPub = publicKeyToAddress(pubKey)

					// validate the file integrity with the token signature
					try {
						const decodedToken = verifyProfileToken(body[0].token, pubKey)
					} catch (e) {
						// TODO: validate the token properly after publishing the subject
						log.error(e)
					}

					if (addressFromPub === bitcoinAddress) resolve(content)
					else reject (`Invalid zonefile`)
				}

            })
        })
        return getContentPromise

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

    public registerName = async (identityClaim: IIdentityClaim, name: string): Promise<string> => {
        let mnemonic = identityClaim.secrets['mnemonic']
        // Check for existing mnemonic
        if (!mnemonic) {
            // Generate new mnemonic if not available
            await this.generateIdentity()
        }
        // Generate the Identity key pair
        let identityKeyPair = await this._generateIdentityKeyPair(mnemonic)

        // Upload the profile.json file to the Gaia hub
        await this._uploadProfileInfo(identityKeyPair.privKey)
        
        // Register the subdomain with Coinswitch registrar service
        let registeredSubdomain = await this._registerSubdomain(name, identityClaim.secrets.identityKeyPair.address)
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
            let bnsNodes = this._bnsNodes
            
            let nodeResponses = bnsNodes.map(baseUrl => this._bnsResolveName(baseUrl, blockstackId))
            log.debug(`BNS node responses:`, nodeResponses);

            Promise.all(nodeResponses).then(responsesArr => {
                log.debug(`BNS resolved JSON array:`, responsesArr);
                let prev_res;
                for (let i = 0; i < responsesArr.length; i++) {
                    const res = responsesArr[i];
                    if (i === 0) {
                        prev_res = res
                    } else {
                        try {
                            deepStrictEqual(prev_res, res)
                        } catch (e) {
                            if (e instanceof AssertionError) {
                                reject(new Error("Name resolution integrity check failed."))
                            } else {
                                log.error(e)
                                throw e;
                            }
                        }
                    }
                    if (i === responsesArr.length - 1) {
                        resolve(responsesArr[0])
                    }
                }
            })
        })
        return promise
    }

    private _bnsResolveName = (baseUrl: string, blockstackId: string): Promise<JSON> => {
        const promise: Promise<JSON> = new Promise((resolve, reject) => {
            let options = { 
                method: 'GET',
                baseUrl: baseUrl,
                url: `/v1/names/${blockstackId}`,
                json: true,
            };

            request(options, function (error, response, body) {
                if (error) reject(new Error(`One or more nodes unavailable because: ${error}`))
                resolve(body)
            })
        })
        return promise
    }

    public getNameAvailability = async (name: string): Promise<boolean> => {
        let blockstackId = this._getBlockstackId(name)
        let nameData = await this._fetchNameDetails(blockstackId)
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

    public putAddressMapping = async (identityClaim: IIdentityClaim, addressMapping: IAddressMapping): Promise<boolean> => {
        if (!identityClaim.secrets.identityKeyPair) {
            if (!identityClaim.secrets.mnemonic) {
                identityClaim = await this.generateIdentity()
            }
            else {
                identityClaim = await this.restoreIdentity({identitySecrets: identityClaim.secrets})
            }
            
        }
        const addressDecoder: Decoder<IAddress> = object({
            addressHash: string(),
            secIdentifier: optional(string())
        });
        const promise: Promise<boolean> = new Promise((resolve, reject) => {
            try {
                for ( let currency in addressMapping ) {
                    let addressObject: IAddress = addressDecoder.runWithException(addressMapping[currency])
                }
                this.uploadContentToGaiaHub('openpay.json', identityClaim.secrets.identityKeyPair.privKey, addressMapping, "application/json")
                    .then( () => {resolve(true)}).catch(error => {reject(`content upload failed, error :- ${error}`)})
            } catch (e) {
                reject (e)
            }
        })
        return promise
    }

    public getAddressMapping = async (name: string, options = {}): Promise<IAddressMapping> => {
        let blockstackId = this._getBlockstackId(name, options['domain'])
        let pubKey = await this.resolveName(blockstackId, options)
        const promise: Promise<IAddressMapping> = new Promise(async (resolve, reject) => {
            try{
                let content: IAddressMapping = await this.getContentFromGaiaHub(blockstackId, pubKey, 'openpay.json');
                resolve(content);
            }
            catch(error){
                reject(`Unable to decode address mapping, ${error}`)
            }
        })
        return promise
    }

    public getGlobalAssetList = async (): Promise<object> => {
        let name = 'ankit2.devcoinswitch.id'
        let publicKey = '0378a4013ff52963500f6a3a31b522d48c36b0bebb56981a870fe52fe85564d55a'
        let blockstackId = this._getBlockstackId(name)
        const assetListPromise = new Promise<object>(async(resolve, reject) => {
            try{
                let assetList: object  =  await this.getContentFromGaiaHub(blockstackId, publicKey, "asset-list.json", "application/json")
                resolve(assetList);
            }
            catch(error){
                reject(`failed to get asset list from gaia hub, error is:- ${error}`)
            }
        });
        return assetListPromise;
    }
    
    public getClientAssetMapping = async (name: string): Promise<object> => {
        let publicKey = await this.resolveName(name)
        let blockstackId = this._getBlockstackId(name)
        const getAssetMappingPromise = new Promise<object>(async(resolve, reject) => {
            try{
                let assetList: object  =  await this.getContentFromGaiaHub(blockstackId, publicKey, "client-mapping.json", "application/json")
                resolve(assetList);
            }
            catch(error){
                reject(`failed to get client asset mapping from gaiahub, error is:- ${error}`)
            }
        });
        return getAssetMappingPromise;
    }
}
