import { makeECPrivateKey, getPublicKeyFromPrivate, publicKeyToAddress, connectToGaiaHub, uploadToGaiaHub, default as blockstack, wrapProfileToken, Person, BlockstackWallet} from "blockstack";
import * as bitcoin from "bitcoinjs-lib";

// NameService abstraction

export interface IBitcoinKeyPair {
    privKey: string
    pubKey: string
    address: string
}


export abstract class NameService {

    constructor() {}

    abstract generateIdentity = () => {}
    abstract exportIdentity = () => {}
    abstract restoreIdentity = () => {}

    abstract registerName = (name: string, _options?: JSON): any => {}
    // resolving a namespace -> publicKey
    // abstract resolve = async (id: string): Promise<any> => {}
    // check for the status of the namespace registration
}





// Blockstack Nameservice implementation


export class BlockstackService extends NameService {
    public blockstack = blockstack
    public bitcoin = bitcoin

    private _mnemonic: string
    private _identityKeyPair: IBitcoinKeyPair


    constructor() {
        super();

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
        let { address, key, keyID} = wallet.getIdentityKeyPair(0)   
        let identityKeyPair: IBitcoinKeyPair = {
            address: address,
            privKey: key,
            pubKey: keyID
        }
        this._identityKeyPair = identityKeyPair
    }



    public restoreIdentity = (options?: JSON) => {
        if (!options || !options['mnemonic']) throw (`Require mnemonic for restoring the identity`)
        this._setMnemonic(options['mnemonic'])
    }

    public generateIdentity = (): void => {
        let newMnemonic = this._generateMnemonic()
        alert(`Your new mnemonic backing your identity is \n ${newMnemonic}`)
        this._mnemonic = newMnemonic
    }

    public exportIdentity = (): any => {
        return this._mnemonic
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

    private _uploadProfileInfo = (privKey: string) => {
        // TODO: validate the privateKey format and convert


        const promise: Promise<boolean> = new Promise(async (resolve, reject) => {
            let hubUrl = "https://hub.blockstack.org"
            connectToGaiaHub(hubUrl, privKey)
                .then(hubConfig => {
                    let sampleProfileObj = {
                        "@context": "http://schema.org/",
                        "@type": "Person"
                    }
                    let person = new Person(sampleProfileObj)
                    let token = person.toToken(privKey)
                    let tokenFile = [wrapProfileToken(token)]
                    console.log(tokenFile)
                    uploadToGaiaHub('profile.json', JSON.stringify(tokenFile), hubConfig, "application/json")
                        .then(finalUrl => {
                            console.log(finalUrl)
                            resolve(true)
                        })
                })
        })
        return promise
    }

    private _registerSubdomain = (name: string, bitcoinAddress: string) => {
        var request = require("request");

        var options = { 
            method: 'POST',
            url: 'http://167.71.234.131:3000/register/',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: 'bearer API-KEY-IF-USED' 
            },
            body: { 
                zonefile: `$ORIGIN ${name}\n$TTL 3600\n_https._tcp URI 10 1 "https://gaia.blockstack.org/hub/${bitcoinAddress}/profile.json"\n`,
                name: name,
                owner_address: bitcoinAddress
            },
            json: true 
        };

        console.log(options)

        request(options, function (error, response, body) {
            if (error) throw new Error(error)
            console.log(body)
        })
    }

    public registerName = async (name: string, _options?: JSON): Promise<any> => {
        // Check for existing mnemonic
        if (!this._mnemonic) {
            // Generate new mnemonic if not available
            this.generateIdentity()
        }
        // Generate the Identity key pair
        await this._generateIdentityKeyPair()

        // Upload the profile.json file to the Gaia hub
        this._uploadProfileInfo(this._identityKeyPair.privKey)
        // Register the subdomain with Coinswitch registrar service
        this._registerSubdomain(name, this._identityKeyPair.address)
    }

    // public resolve = async (id: string): Promise<string> => {
    //     let profile = await lookupProfile(id)
    //     console.log(profile)
    //     console.log(profile.address)
    //     return profile.address
    // }

    // lookup = () => {
    //     console.log(lookupProfile('coinswitch.id'))
    // }
    // zone = (zonefile, address) => {
    //     console.log(resolveZoneFileToPerson(zonefile, address, console.log))
    // }
}