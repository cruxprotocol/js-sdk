
import {Decoder, object, optional, string} from "@mojotech/json-type-validation";
import { AssertionError, deepStrictEqual } from "assert";
import * as blockstack from "blockstack";
import { SECP256K1Client, TokenSigner } from "jsontokens";
import { AddressMapping, getLogger, IAddress, IAddressMapping } from "..";
import config from "../config";

import * as Errors from "./errors";
import {BlockstackId, CruxId, IdTranslator} from "./identity-utils";
import { httpJSONRequest } from "./utils";

const log = getLogger(__filename);

// NameService abstraction

export interface IIdentityClaim {
    secrets: any;
}

export abstract class NameService {
    // TODO: Make CHILD CLASS implement instead of extend
    public abstract generateIdentity = async (): Promise<IIdentityClaim> => ({ secrets: null });
    public abstract restoreIdentity = async (name: string, options?: any): Promise<IIdentityClaim> => ({ secrets: null });
    public abstract getDecryptionKey = async (identityClaim: IIdentityClaim): Promise<string> => "";
    public abstract getEncryptionKey = async (identityClaim: IIdentityClaim): Promise<string> => "";
    public abstract getNameAvailability = async (name: string): Promise<boolean> => false;
    public abstract registerName = async (identityClaim: IIdentityClaim, name: string): Promise<string> => "";
    // TODO: need to respond with boolean
    public abstract getRegistrationStatus = async (identityClaim: IIdentityClaim): Promise<CruxIDRegistrationStatus> => ({status: "", status_detail: ""});
    public abstract getAddressMapping = async (name: string, options?: JSON): Promise<IAddressMapping> => ({});
    public abstract putAddressMapping = async (identityClaim: IIdentityClaim, addressMapping: IAddressMapping): Promise<boolean> => false;
    // TODO: Implement methods to add/update address mapping (Gamma usecase)

}

// Blockstack Nameservice implementation
export interface IBitcoinKeyPair {
    privKey: string;
    pubKey: string;
    address: string;
}

export interface IBlockstackServiceOptions {
    domain: string;
    gaiaHub: string;
    subdomainRegistrar: string;
    bnsNodes: string[];
}

export enum SubdomainRegistrationStatus {
    NONE = "NONE",
    PENDING = "PENDING",
    DONE = "DONE",
    REJECT = "REJECT",
}

enum SubdomainRegistrationStatusDetail {
    NONE = "Subdomain not registered with this registrar.",
    PENDING_REGISTRAR = "Subdomain registration pending on registrar.",
    PENDING_BLOCKCHAIN = "Subdomain registration pending on blockchain.",
    DONE = "Subdomain propagated.",
}

export interface CruxIDRegistrationStatus {
    status: string;
    status_detail: string;
}

interface IdentityCouple {
    cruxId: CruxId;
    bsId: BlockstackId;
}

const getIdentityCoupleFromCruxId = (cruxId: CruxId): IdentityCouple => {
    return {
        bsId: IdTranslator.cruxToBlockstack(cruxId),
        cruxId,
    };
};

const defaultBNSConfig: IBlockstackServiceOptions = {
    bnsNodes: config.BLOCKSTACK.BNS_NODES,
    domain: config.BLOCKSTACK.IDENTITY_DOMAIN,
    gaiaHub: config.BLOCKSTACK.GAIA_HUB,
    subdomainRegistrar: config.BLOCKSTACK.SUBDOMAIN_REGISTRAR,
};

export class BlockstackService extends NameService {
    public readonly type = "blockstack";

    private _domain: string;
    private _gaiaHub: string;
    private _subdomainRegistrar: string;

    private _subdomain: string | undefined;
    private _bnsNodes: string[];
    private _identityCouple: IdentityCouple | undefined;

    constructor(options: any = {}) {
        super();
        // TODO: Verify Domain against Registrar
        const _options: IBlockstackServiceOptions = {...defaultBNSConfig, ...options};

        this._domain = _options.domain;
        this._gaiaHub = _options.gaiaHub;
        this._subdomainRegistrar = _options.subdomainRegistrar;
        // @ts-ignore
        this._bnsNodes = [...new Set([...config.BLOCKSTACK.BNS_NODES, ..._options.bnsNodes])];   // always append the extra configured BNS nodes (needs `downlevelIteration` flag enabled in tsconfig.json)
    }

    public getDecryptionKey = async (identityClaim: IIdentityClaim): Promise<string> => {
        console.groupCollapsed("Retrieving decryptionKey");
        let identityKeyPair: IBitcoinKeyPair;

        if (!identityClaim.secrets.identityKeyPair) {
            identityKeyPair = await this._generateIdentityKeyPair(identityClaim.secrets.mnemonic);
        } else {
            identityKeyPair = identityClaim.secrets.identityKeyPair;
        }

        const decryptionKey = (identityKeyPair.privKey.substr(-2) === "01" && identityKeyPair.privKey.length >= 66) ? identityKeyPair.privKey.slice(0, -2) : identityKeyPair.privKey;
        console.groupEnd();
        return decryptionKey;
    }

    public getEncryptionKey = async (identityClaim: IIdentityClaim): Promise<string> => {
        console.groupCollapsed("Retrieving encryptionKey");
        let identityKeyPair: IBitcoinKeyPair;

        if (!identityClaim.secrets.identityKeyPair) {
            identityKeyPair = await this._generateIdentityKeyPair(identityClaim.secrets.mnemonic);
        } else {
            identityKeyPair = identityClaim.secrets.identityKeyPair;
        }

        const encryptionKey = identityKeyPair.pubKey;
        console.groupEnd();
        return encryptionKey;
    }

    public restoreIdentity = async (fullCruxId: string, options?: any): Promise<IIdentityClaim> => {
        console.groupCollapsed("Restoring identity secrets");
        if (!options || !options.identitySecrets) {
            console.groupEnd();
            throw new Error((`Require mnemonic for restoring the identity`));
        }

        const mnemonic = options.identitySecrets.mnemonic;
        let identityKeyPair = options.identitySecrets.identityKeyPair || undefined;

        // If identityKeypair is not stored locally, generate them using the mnemonic
        if (!identityKeyPair) {
            identityKeyPair = await this._generateIdentityKeyPair(mnemonic);
        }

        const cruxId = CruxId.fromString(fullCruxId);
        this._identityCouple = getIdentityCoupleFromCruxId(cruxId);
        console.groupEnd();
        return {
            secrets: {
                identityKeyPair,
                mnemonic,
            },
        };

    }

    public generateIdentity = async (): Promise<IIdentityClaim> => {
        console.groupCollapsed("Generating identity secrets");
        const newMnemonic = this._generateMnemonic();
        // log.debug(newMnemonic)
        log.warn(`Your new mnemonic backing your identity is: \n${newMnemonic}`);
        const identityKeyPair = await this._generateIdentityKeyPair(newMnemonic);
        console.groupEnd();
        return {
            secrets: {
                identityKeyPair,
                mnemonic: newMnemonic,
            },
        };
    }

    public uploadContentToGaiaHub = async (filename: string, privKey: string, content: any, type= "application/json"): Promise<string> => {
        console.groupCollapsed("Uploading content to gaiaHub");
        const sanitizedPrivKey = this._sanitizePrivKey(privKey);
        const hubURL = this._gaiaHub;
        const hubConfig = await blockstack.connectToGaiaHub(hubURL, sanitizedPrivKey);
        const tokenFile = this._generateTokenFileForContent(sanitizedPrivKey, content);
        let contentToUpload: any = null;
        if (type === "application/json") {
            contentToUpload = JSON.stringify(tokenFile);
        } else {
            console.groupEnd();
            throw new Error(`Unhandled content-type ${type}`);
        }
        let finalURL: string;
        try {
            finalURL = await blockstack.uploadToGaiaHub(filename, contentToUpload, hubConfig, type);
            log.debug(`finalUrl is ${finalURL}`);
        } catch (error) {
            console.groupEnd();
            throw new Errors.ClientErrors.GaiaUploadFailed(`unable to upload ${filename} to gaiahub, ${error}`, 2005);
        }
        console.groupEnd();
        return finalURL;
    }

    public getGaiaReadUrl = async (gaiaHubURL: string): Promise<string> => {

        const options = {
            json: true,
            method: "GET",
            url: gaiaHubURL + "/hub_info" ,
        };
        try {
            const responseBody: any = await httpJSONRequest(options);
            const gaiaReadURL = responseBody.read_url_prefix;
            return gaiaReadURL;
        } catch (err) {
            throw new Errors.ClientErrors.GaiaGetFileFailed(`Unable to get gaia read url prefix: ${err}`, 2105);
        }
    }

    public getContentFromGaiaHub = async (blockstackId: string, filename: string, type= "application/json"): Promise<any> => {
        console.groupCollapsed("Resolving content from gaiaHub");
        let nameData: any;
        try {
            nameData = await this._fetchNameDetails(blockstackId);
        } catch (error) {
            console.groupEnd();
            throw error;
        }
        log.debug(nameData);
        if (!nameData) {
            console.groupEnd();
            throw new Error((`No name data availabe!`));
        }
        if (!nameData.address) {
            console.groupEnd();
            throw new Errors.ClientErrors.UserDoesNotExist("ID does not exist", 1037);
        }
        const bitcoinAddress = nameData.address;
        log.debug(`ID owner: ${bitcoinAddress}`);
        let profileUrl: string;
        if (nameData.zonefile === null) {
            const gaiaPrefix = await this.getGaiaReadUrl(this._gaiaHub);
            profileUrl = gaiaPrefix + nameData.address + "/" + filename;
        } else {
            profileUrl = "https://" + nameData.zonefile.match(new RegExp("(.+)https:\/\/(.+)\/profile.json", "s"))[2] + "/" + filename;
        }
        const options = {
            json: true,
            method: "GET",
            url: profileUrl,
        };

        let finalContent: any;
        const responseBody: any = await httpJSONRequest(options);
        log.debug(`Response from cruxpay.json`, responseBody);
        let content: string;

        if (responseBody.indexOf("BlobNotFound") > 0) {
            finalContent = "";
        } else {
            try {
                content = responseBody[0].decodedToken.payload.claim;
                if (!(type === "application/json")) {
                    log.error(`unhandled content type`);
                    console.groupEnd();
                    throw new Error("invalid content type");
                }
                log.debug(`Content:- `, content);
            } catch (e) {
                log.error(e);
                console.groupEnd();
                throw new Error((`Probably this id resolves to a domain registrar`));
            }

            const pubKey = responseBody[0].decodedToken.payload.subject.publicKey;
            const addressFromPub = blockstack.publicKeyToAddress(pubKey);

            // validate the file integrity with the token signature
            try {
                const decodedToken = blockstack.verifyProfileToken(responseBody[0].token, pubKey);
            } catch (e) {
                // TODO: validate the token properly after publishing the subject
                log.error(e);
                console.groupEnd();
                throw new Errors.ClientErrors.TokenVerificationFailed(`Token Verification failed for ${profileUrl}`, 2016);
            }

            if (addressFromPub === bitcoinAddress) {
                finalContent = content;
            } else {
                console.groupEnd();
                throw new Error(`Invalid zonefile`);
            }
        }
        console.groupEnd();
        return finalContent;

    }

    public registerName = async (identityClaim: IIdentityClaim, subdomain: string): Promise<string> => {
        console.groupCollapsed("Registering name on blockstack");
        const mnemonic = identityClaim.secrets.mnemonic;
        let identityKeyPair = identityClaim.secrets.identityKeyPair;
        // Check for existing mnemonic
        if (!mnemonic) {
            // Generate new mnemonic if not available
            await this.generateIdentity();
        }
        // Generate the Identity key pair
        if (!identityKeyPair) {
            identityKeyPair = await this._generateIdentityKeyPair(mnemonic);
        }

        await this._uploadProfileInfo(identityKeyPair.privKey);

        const registeredSubdomain = await this._registerSubdomain(subdomain, identityClaim.secrets.identityKeyPair.address);
        this._identityCouple = getIdentityCoupleFromCruxId(new CruxId({
            domain: this._domain,
            subdomain,
        }));
        console.groupEnd();
        return this._identityCouple.cruxId.toString();
    }

    public getRegistrationStatus = async (identityClaim: IIdentityClaim): Promise<CruxIDRegistrationStatus> => {
        console.groupCollapsed("Get name registration status");
        log.debug("====getRegistrationStatus====");
        if (!this._identityCouple) {
            console.groupEnd();
            return {
                status: SubdomainRegistrationStatus.NONE,
                status_detail: "",
            };
        }
        const nameData: any = await this._fetchNameDetails(this._identityCouple.bsId.toString());
        let status: SubdomainRegistrationStatus;
        let status_detail: string = "";
        if (nameData.status === "registered_subdomain") {
            if (nameData.address === identityClaim.secrets.identityKeyPair.address) {
                status = SubdomainRegistrationStatus.DONE;
                status_detail = SubdomainRegistrationStatusDetail.DONE;
            } else {
                status = SubdomainRegistrationStatus.REJECT;
            }
            console.groupEnd();
            return {
                status,
                status_detail,
            };
        }
        const options = {
            baseUrl: this._subdomainRegistrar,
            json: true,
            method: "GET",
            url: `/status/${this._identityCouple.bsId.components.subdomain}`,
        };
        log.debug("registration query params", options);
        const body = await httpJSONRequest(options);
        const registrationStatus = this.getCruxIdRegistrationStatus(body);
        console.groupEnd();
        return registrationStatus;
    }

    public getNameAvailability = async (subdomain: string): Promise<boolean> => {
        console.groupCollapsed("Get name availability");

        const options = {
            baseUrl: this._subdomainRegistrar,
            json: true,
            method: "GET",
            url: `/status/${subdomain}`,
        };
        log.debug("registration query params", options);
        const body: any = await httpJSONRequest(options);
        if (body.status === "Subdomain not registered with this registrar") {
            console.groupEnd();
            return true;
        }
        console.groupEnd();
        return false;
    }

    public _getNamespaceArray = (name: string, domainFallback?: string): [string, string?, string?] => {
        log.debug(`_getNamespaceArray for ${name}`);
        let subdomain: string, domain: string, namespace: string;
        namespace = "id";
        if (name.substr(-3) === ".id") {
            const idArray = name.split(".").reverse();
            log.debug(idArray);
            domain = idArray[1];
            subdomain = idArray[2];
        } else {
            subdomain = name;
            domain = domainFallback ? domainFallback.split(".").reverse()[1] : this._domain.split(".")[0];
        }
        if (subdomain) {
            return [namespace, domain, subdomain];
        } else {
            // while trying to get public key of domain owner
            return [namespace, domain];
        }
    }

    public putAddressMapping = async (identityClaim: IIdentityClaim, addressMapping: IAddressMapping): Promise<boolean> => {
        console.groupCollapsed("Update address mapping to gaiaHub");
        if (!identityClaim.secrets.identityKeyPair) {
            console.groupEnd();
            throw new Error(`missing identity key pair`);
        }
        const addressDecoder: Decoder<IAddress> = object({
            addressHash: string(),
            secIdentifier: optional(string()),
        });
        try {
            for ( const currency of Object.keys(addressMapping) ) {
                const addressObject: IAddress = addressDecoder.runWithException(addressMapping[currency]);
            }
            await this.uploadContentToGaiaHub("cruxpay.json", identityClaim.secrets.identityKeyPair.privKey, addressMapping, "application/json");
        } catch (e) {
            console.groupEnd();
            throw e;
        }
        console.groupEnd();
        // TODO: need to validate the final uploaded URL is corresponding to the identityClaim provided
        return true;
    }

    public getAddressMapping = async (fullCruxId: string, options = {}): Promise<IAddressMapping> => {
        console.groupCollapsed("Resolving address mapping from gaiaHub");
        const cruxId = CruxId.fromString(fullCruxId);
        const blockstackIdString = IdTranslator.cruxToBlockstack(cruxId).toString();
        const content: IAddressMapping = await this.getContentFromGaiaHub(blockstackIdString, "cruxpay.json", "application/json");
        console.groupEnd();
        return content;
    }

    private _generateMnemonic = (): string => {
        return blockstack.BlockstackWallet.generateMnemonic();
    }

    private _generateIdentityKeyPair = async (mnemonic: string): Promise<IBitcoinKeyPair> => {
        // TODO: need to use passcode encryption
        const encryptedMnemonic = await blockstack.BlockstackWallet.encryptMnemonic(mnemonic, "temp");
        const wallet = await blockstack.BlockstackWallet.fromEncryptedMnemonic(encryptedMnemonic, "temp");
        // Using the first identity key pair for now
        // TODO: need to validate the name registration on the address if already available
        const { address, key, keyID} = wallet.getIdentityKeyPair(0);
        const identityKeyPair: IBitcoinKeyPair = {
            address,
            privKey: key,
            pubKey: keyID,
        };
        return identityKeyPair;
    }

    private _generateKeyPair = (): IBitcoinKeyPair => {

        const privKey = blockstack.makeECPrivateKey();
        const pubKey = blockstack.getPublicKeyFromPrivate(privKey);
        const address = blockstack.publicKeyToAddress(pubKey);

        const bitcoinKeyPair: IBitcoinKeyPair = {privKey, pubKey, address};

        return bitcoinKeyPair;
    }

    private _getPubKey = (privKey: string): string => {
        return blockstack.getPublicKeyFromPrivate(privKey);
    }

    private _sanitizePrivKey = (privKey: string): string => {
        if (privKey.length === 66 && privKey.slice(64) === "01") {
            privKey = privKey.slice(0, 64);
        }
        return privKey;
    }

    private _uploadProfileInfo = async (privKey: string): Promise<boolean> => {
        // TODO: validate the privateKey format and convert
        privKey = this._sanitizePrivKey(privKey);

        const hubUrl = this._gaiaHub;
        const hubConfig = await blockstack.connectToGaiaHub(hubUrl, privKey);
        const profileObj = {
            "@context": "http://schema.org/",
            "@type": "Person",
        };
        const person = new blockstack.Person(profileObj);
        const token = person.toToken(privKey);
        log.debug(token);
        const tokenFile = [blockstack.wrapProfileToken(token)];
        log.debug(tokenFile);
        try {
            const finalUrl = await blockstack.uploadToGaiaHub("profile.json", JSON.stringify(tokenFile), hubConfig, "application/json");
            log.debug(finalUrl);
        } catch (e) {
            throw new Errors.ClientErrors.GaiaUploadFailed(`Unable to upload profile.json to gaiahub, ${e}`, 2006);
        }
        return true;
    }

    private _generateTokenFileForContent(privateKey: string, content: any) {
        const publicKey = SECP256K1Client.derivePublicKey(privateKey);
        const tokenSigner = new TokenSigner("ES256K", privateKey);
        const payload = {
            claim: content,
            issuer: { publicKey },
            subject: { publicKey },
        };
        const token = tokenSigner.sign(payload);
        const tokenFile = [blockstack.wrapProfileToken(token)];
        return tokenFile;
    }

    private _registerSubdomain = async (name: string, bitcoinAddress: string): Promise<string> => {
        const gaiaPrefix = await this.getGaiaReadUrl(this._gaiaHub);
        const options = {
            baseUrl: this._subdomainRegistrar,
            body: {
                name,
                owner_address: bitcoinAddress,
                zonefile: `$ORIGIN ${name}\n$TTL 3600\n_https._tcp URI 10 1 "${gaiaPrefix}${bitcoinAddress}/profile.json"\n`,
            },
            headers: {
                "Content-Type": "application/json",
            },
            json: true,
            method: "POST",
            strictSSL: false,
            url: "/register",
        };

        let registrationAcknowledgement: any;
        try {
            registrationAcknowledgement = await httpJSONRequest(options);
        } catch (err) {
            throw new Errors.ClientErrors.RegisterSubdomainFailed("Register call to regsitrar failed", 3001);
        }

        log.debug(`Subdomain registration acknowledgement:`, registrationAcknowledgement);
        if (registrationAcknowledgement && registrationAcknowledgement.status === true) {
            return name;
        } else {
            throw new Error(registrationAcknowledgement);
        }
    }

    private getCruxIdRegistrationStatus = (body: any): CruxIDRegistrationStatus =>  {
        let status: CruxIDRegistrationStatus;
        const rawStatus = body.status;
        log.info(body);
        if (rawStatus && rawStatus.includes("Your subdomain was registered in transaction")) {
            status = {
            status: SubdomainRegistrationStatus.PENDING,
            status_detail: SubdomainRegistrationStatusDetail.PENDING_REGISTRAR,
            };
        } else {
            switch (rawStatus) {
                case "Subdomain not registered with this registrar":
                    status = {
                        status: SubdomainRegistrationStatus.NONE,
                        status_detail: SubdomainRegistrationStatusDetail.NONE,
                    };
                    break;
                case "Subdomain is queued for update and should be announced within the next few blocks.":
                    status = {
                        status: SubdomainRegistrationStatus.PENDING,
                        status_detail: SubdomainRegistrationStatusDetail.PENDING_BLOCKCHAIN,
                    };
                    break;
                case "Subdomain propagated":
                    log.debug("Skipping this because meant to be done by BNS node");
                default:
                    status = {
                        status: SubdomainRegistrationStatus.NONE,
                        status_detail: "",
                    };
                    break;
            }
        }
        return status;
    }

    private _fetchNameDetails = async (blockstackId: string): Promise<object|undefined> => {
        const bnsNodes = this._bnsNodes;

        const nodeResponses = bnsNodes.map((baseUrl) => this._bnsResolveName(baseUrl, blockstackId));
        log.debug(`BNS node responses:`, nodeResponses);

        const responsesArr = await Promise.all(nodeResponses);
        log.debug(`BNS resolved JSON array:`, responsesArr);
        let prev_res;
        let response: object;
        for (let i = 0; i < responsesArr.length; i++) {
            const res = responsesArr[i];
            if (i === 0) {
                prev_res = res;
            } else {
                try {
                    deepStrictEqual(prev_res, res);
                } catch (e) {
                    if (e instanceof AssertionError) {
                        throw new Errors.ClientErrors.NameIntegrityCheckFailed("Name resolution integrity check failed.", 1100);
                    } else {
                        log.error(e);
                        throw e;
                    }
                }
            }
            // TODO: unhandled else case
            if (i === responsesArr.length - 1) {
                response = responsesArr[0];
            }
        }
        // @ts-ignore
        return response;
    }

    private _bnsResolveName = async (baseUrl: string, blockstackId: string): Promise<object> => {
        const options = {
            baseUrl,
            json: true,
            method: "GET",
            url: `/v1/names/${blockstackId}`,
        };
        let nameData;
        try {
            nameData = await httpJSONRequest(options);
        } catch (e) {
            throw new Errors.ClientErrors.BnsResolutionFailed(baseUrl, `${baseUrl} node not available because ${e}`, 1004);
        }
        return nameData;
    }
}
