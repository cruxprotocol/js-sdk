import { Decoder, object, optional, string } from "@mojotech/json-type-validation";
import * as bip39 from "bip39";
import {bip32} from "bitcoinjs-lib";
import * as blockstack from "blockstack";
import { IAddress, IAddressMapping } from "../..";

import {randomBytes} from "crypto";
import { Encryption } from "../encryption";
import { BaseError, ErrorHelper, PackageErrorCode } from "../error";
import { PackageError } from "../error/package-error";
import { GaiaService } from "../gaia-service";
import { getContentFromGaiaHub } from "../gaia-service/utils";
import { BlockstackId, CRUX_DOMAIN_SUFFIX, CruxId, DEFAULT_BLOCKSTACK_NAMESPACE, IdTranslator } from "../identity-utils";
import { getLogger } from "../logger";
import { StorageService } from "../storage";
import * as utils from "../utils";
import * as nameService from "./index";
import { fetchNameDetails } from "./utils";

const log = getLogger(__filename);
export const MNEMONIC_STORAGE_KEY: string = "encryptedMnemonic";

// Blockstack Nameservice implementation
export interface IBitcoinKeyPair {
    privKey: string;
    pubKey: string;
    address: string;
}

export interface IBlockstackServiceInputOptions {
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

const getIdentityCoupleFromBlockstackId = (blockstackId: BlockstackId): IdentityCouple => {
    return {
        bsId: blockstackId,
        cruxId: IdTranslator.blockstackToCrux(blockstackId),
    };
};

export enum UPLOADABLE_JSON_FILES {
    CRUXPAY = "cruxpay.json",
    CLIENT_CONFIG = "client-config.json",
}

export class BlockstackService extends nameService.NameService {

    public static getUploadPackageErrorCodeForFilename = (filename: UPLOADABLE_JSON_FILES) => {
        let packageErrorCode;
        switch (filename) {
            case UPLOADABLE_JSON_FILES.CRUXPAY:
                packageErrorCode = PackageErrorCode.GaiaCruxPayUploadFailed;
                break;
            case UPLOADABLE_JSON_FILES.CLIENT_CONFIG:
                packageErrorCode = PackageErrorCode.GaiaClientConfigUploadFailed;
                break;
            default:
                packageErrorCode = PackageErrorCode.GaiaUploadFailed;
        }
        return packageErrorCode;
    }

    public static getGetPackageErrorCodeForFilename = (filename: UPLOADABLE_JSON_FILES) => {
        let packageErrorCode;
        switch (filename) {
            case UPLOADABLE_JSON_FILES.CRUXPAY:
                packageErrorCode = PackageErrorCode.GaiaCruxPayGetFailed;
                break;
            case UPLOADABLE_JSON_FILES.CLIENT_CONFIG:
                packageErrorCode = PackageErrorCode.GaiaClientConfigGetFailed;
                break;
            default:
                packageErrorCode = PackageErrorCode.GaiaGetFileFailed;
        }
        return packageErrorCode;
    }

    public readonly type = "blockstack";

    private _domain: string;
    private _gaiaHub: string;
    private _subdomainRegistrar: string;
    private _bnsNodes: string[];
    private _identityCouple?: IdentityCouple;
    private _gaiaService: GaiaService;

    constructor(options: IBlockstackServiceInputOptions) {
        super();
        // TODO: Verify Domain against Registrar
        if (!options.domain) {
            throw new BaseError(null, "No wallet name sepcified!");
        }
        this._domain = options.domain;
        this._gaiaHub = options.gaiaHub;
        this._subdomainRegistrar = options.subdomainRegistrar;
        this._bnsNodes = options.bnsNodes;
        this._gaiaService = new GaiaService(this._gaiaHub);

    }

    public restoreIdentity = async (fullCruxId: string, identityClaim: nameService.IIdentityClaim): Promise<nameService.IIdentityClaim> => {
        const identityKeyPair = identityClaim.secrets.identityKeyPair;

        if (!identityKeyPair) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.CouldNotFindKeyPairToRestoreIdentity);
        }

        // TODO: validate the correspondance of cruxID with the identityClaim
        const cruxId = CruxId.fromString(fullCruxId);
        this._identityCouple = getIdentityCoupleFromCruxId(cruxId);
        const nameData: any = await fetchNameDetails(this._identityCouple.bsId.toString(), this._bnsNodes);
        if ( nameData.address && (nameData.address !== identityKeyPair.address)) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.IdentityMismatch);
        }

        return {
            secrets: {
                identityKeyPair,
            },
        };

    }

    public registerName = async (identityClaim: nameService.IIdentityClaim, subdomain: string): Promise<string> => {
        const identityKeyPair: IBitcoinKeyPair = identityClaim.secrets.identityKeyPair;

        if (!identityKeyPair) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.CouldNotFindKeyPairToRegisterName);
        }

        // Publishing an empty addressMap while registering the name to be fail safe
        await this._uploadContentToGaiaHub(UPLOADABLE_JSON_FILES.CRUXPAY, identityKeyPair.privKey, {}, IdTranslator.blockstackDomainToCruxDomain(this._domain));

        const registeredSubdomain = await this._registerSubdomain(subdomain, identityKeyPair.address);
        this._identityCouple = getIdentityCoupleFromBlockstackId(new BlockstackId({
            domain: this._domain,
            subdomain,
        }));
        return this._identityCouple.cruxId.toString();
    }

    public getRegistrationStatus = async (identityClaim: nameService.IIdentityClaim): Promise<nameService.CruxIDRegistrationStatus> => {
        log.debug("====getRegistrationStatus====");
        if (!this._identityCouple) {
            return {
                status: SubdomainRegistrationStatus.NONE,
                statusDetail: "",
            };
        }
        const nameData: any = await fetchNameDetails(this._identityCouple.bsId.toString(), this._bnsNodes);
        let status: SubdomainRegistrationStatus;
        let statusDetail: string = "";
        if (nameData.status === "registered_subdomain") {
            if (nameData.address === identityClaim.secrets.identityKeyPair.address) {
                status = SubdomainRegistrationStatus.DONE;
                statusDetail = SubdomainRegistrationStatusDetail.DONE;
            } else {
                status = SubdomainRegistrationStatus.REJECT;
            }
            return {
                status,
                statusDetail,
            };
        }
        const options = {
            baseUrl: this._subdomainRegistrar,
            headers: {
                "x-domain-name": this._domain,
            },
            json: true,
            method: "GET",
            url: `/status/${this._identityCouple.bsId.components.subdomain}`,
        };
        log.debug("registration query params", options);
        const body = await utils.httpJSONRequest(options);
        const registrationStatus = this.getCruxIdRegistrationStatus(body);
        return registrationStatus;
    }

    public getNameAvailability = async (subdomain: string): Promise<boolean> => {
        const options = {
            baseUrl: this._subdomainRegistrar,
            headers: {
                "x-domain-name": this._domain,
            },
            json: true,
            method: "GET",
            url: `/status/${subdomain}`,
        };
        log.debug("registration query params", options);
        const body: any = await utils.httpJSONRequest(options);
        return body.status === "Subdomain not registered with this registrar";

    }

    public getDomainAvailability = async (domain: string): Promise<boolean> => {
        const options = {
            baseUrl: this._bnsNodes[0],
            json: true,
            method: "GET",
            url: `/v1/names/${domain}${CRUX_DOMAIN_SUFFIX}.${DEFAULT_BLOCKSTACK_NAMESPACE}`,
        };
        log.debug("domain name availability query params", options);
        const body: any = await utils.httpJSONRequest(options);
        return body.status === "available";

    }

    public putAddressMapping = async (identityClaim: nameService.IIdentityClaim, addressMapping: IAddressMapping): Promise<void> => {
        if (!identityClaim.secrets.identityKeyPair) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.CouldNotFindIdentityKeyPairToPutAddressMapping);
        }
        const addressDecoder: Decoder<IAddress> = object({
            addressHash: string(),
            secIdentifier: optional(string()),
        });
        try {
            for ( const currency of Object.keys(addressMapping) ) {
                const addressObject: IAddress = addressDecoder.runWithException(addressMapping[currency]);
            }
        } catch (error) {
            throw ErrorHelper.getPackageError(error, PackageErrorCode.AddressMappingDecodingFailure);
        }
        await this._uploadContentToGaiaHub(UPLOADABLE_JSON_FILES.CRUXPAY, identityClaim.secrets.identityKeyPair.privKey, addressMapping, IdTranslator.blockstackDomainToCruxDomain(this._domain));
        return;
    }

    public getAddressMapping = async (fullCruxId: string): Promise<IAddressMapping> => {
        const cruxId = CruxId.fromString(fullCruxId);
        const blockstackIdString = IdTranslator.cruxToBlockstack(cruxId).toString();
        return await this._getContentFromGaiaHub(blockstackIdString, UPLOADABLE_JSON_FILES.CRUXPAY, cruxId.components.domain);
    }

    private _storeMnemonic = async (mnemonic: string, storage: StorageService, encryptionKey: string): Promise<void> => {
        await storage.setItem(MNEMONIC_STORAGE_KEY, JSON.stringify(await Encryption.encryptText(mnemonic, encryptionKey)));
    }

    private _retrieveMnemonic = async (storage: StorageService, encryptionKey: string): Promise<string> => {
        const encryptedMnemonic = JSON.parse(await storage.getItem(MNEMONIC_STORAGE_KEY) as string) as {encBuffer: string, iv: string};
        return await Encryption.decryptText(encryptedMnemonic.encBuffer, encryptedMnemonic.iv, encryptionKey);
    }

    private _generateMnemonic = (): string => {
        return bip39.generateMnemonic(128, randomBytes);
    }

    private _registerSubdomain = async (name: string, bitcoinAddress: string): Promise<string> => {
        const options = {
            baseUrl: this._subdomainRegistrar,
            body: {
                name,
                owner_address: bitcoinAddress,
                zonefile: `$ORIGIN ${name}\n$TTL 3600\n_https._tcp URI 10 1 ${this._gaiaService.gaiaWriteUrl}`,
            },
            headers: {
                "Content-Type": "application/json",
                "x-domain-name": this._domain,
            },
            json: true,
            method: "POST",
            strictSSL: false,
            url: "/register",
        };

        let registrationAcknowledgement: any;
        try {
            registrationAcknowledgement = await utils.httpJSONRequest(options);
        } catch (err) {
            throw ErrorHelper.getPackageError(err, PackageErrorCode.SubdomainRegistrationFailed, err);
        }

        log.debug(`Subdomain registration acknowledgement:`, registrationAcknowledgement);
        if (registrationAcknowledgement && registrationAcknowledgement.status === true) {
            return name;
        } else {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.SubdomainRegistrationAcknowledgementFailed, JSON.stringify(registrationAcknowledgement));
        }
    }

    private getCruxIdRegistrationStatus = (body: any): nameService.CruxIDRegistrationStatus =>  {
        let status: nameService.CruxIDRegistrationStatus;
        const rawStatus = body.status;
        log.info(body);
        if (rawStatus && rawStatus.includes("Your subdomain was registered in transaction")) {
            status = {
            status: SubdomainRegistrationStatus.PENDING,
            statusDetail: SubdomainRegistrationStatusDetail.PENDING_REGISTRAR,
            };
        } else {
            switch (rawStatus) {
                case "Subdomain not registered with this registrar":
                    status = {
                        status: SubdomainRegistrationStatus.NONE,
                        statusDetail: SubdomainRegistrationStatusDetail.NONE,
                    };
                    break;
                case "Subdomain is queued for update and should be announced within the next few blocks.":
                    status = {
                        status: SubdomainRegistrationStatus.PENDING,
                        statusDetail: SubdomainRegistrationStatusDetail.PENDING_BLOCKCHAIN,
                    };
                    break;
                case "Subdomain propagated":
                    log.debug("Skipping this because meant to be done by BNS node");
                default:
                    status = {
                        status: SubdomainRegistrationStatus.NONE,
                        statusDetail: "",
                    };
                    break;
            }
        }
        return status;
    }

    private _uploadContentToGaiaHub = async (filename: UPLOADABLE_JSON_FILES, privKey: string, content: any, prefix: string): Promise<string> => {
        const filenameToUpload =  `${prefix}_${filename}`;
        let finalURL: string;
        try {
            finalURL = await this._gaiaService.uploadContentToGaiaHub(filenameToUpload, privKey, content, prefix);
            log.debug(`finalUrl is ${finalURL}`);
        } catch (error) {
            const packageErrorCode = BlockstackService.getUploadPackageErrorCodeForFilename(filename);
            throw ErrorHelper.getPackageError(error, packageErrorCode, filename, error);
        }
        return finalURL;
    }

    private _getContentFromGaiaHub = async (blockstackId: string, filename: UPLOADABLE_JSON_FILES, prefix: string): Promise<any> => {
        const filenameToFetch = `${prefix}_${filename}`;
        let responseBody: any;
        try {
            responseBody = await getContentFromGaiaHub(blockstackId, filenameToFetch, this._bnsNodes);
            log.debug(`Response from ${filenameToFetch}`, responseBody);
        } catch (error) {
            if (error instanceof PackageError && error.errorCode) {
                throw error;
            } else {
                const packageErrorCode = BlockstackService.getGetPackageErrorCodeForFilename(filename);
                throw ErrorHelper.getPackageError(error, packageErrorCode, filename, error);
            }
        }
        return responseBody;
    }
}
