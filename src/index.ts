import { EventEmitter } from "eventemitter3";
import Logger from "js-logger";
import path from "path";
import "regenerator-runtime/runtime";
import config from "./config";

// Setup logging configuration
Logger.useDefaults();
Logger.setLevel(config.CONFIG_MODE === "prod" ? Logger.INFO : Logger.DEBUG);
export function getLogger(filename: string) {
    return Logger.get("OpenPay: " + filename.slice(filename.lastIndexOf(path.sep) + 1, filename.length - 3));
}
const log = getLogger(__filename);

// Importing packages
import { BlockstackConfigurationService, encryption, Errors, nameservice, storage, identityUtils } from "./packages";

// TODO: Implement classes enforcing the interfaces
export interface IAddress {
    addressHash: string;
    secIdentifier?: string;
}

export interface IAddressMapping {
    [currency: string]: IAddress;
}

export class AddressMapping {
    constructor(values: IAddressMapping | any = {}) {
        Object.assign(this, values);
    }
    public toJSON() {
        return Object.assign({}, this);
    }
}

// SDK core class

interface IOpenPayPeerOptions {
    getEncryptionKey: () => string;
    storage?: storage.StorageService;
    encryption?: typeof encryption.Encryption;
    nameservice?: nameservice.NameService;
    walletClientName: string;
}

interface IIdentitySecrets {
    [nameservice: string]: nameservice.IIdentityClaim;
}

interface IOpenPayClaim {
    virtualAddress?: string;
    identitySecrets?: string | nameservice.IIdentityClaim;
}

export interface ICruxIDState {
    cruxID?: string;
    status: nameservice.CruxIDRegistrationStatus;
}

interface openPayOptions {
    getEncryptionKey: () => string;
    encryption?: typeof encryption.Encryption;
    storage?: storage.StorageService;
}

export class PayIDClaim implements IOpenPayClaim {

    public virtualAddress: string | undefined;
    public identitySecrets: string | nameservice.IIdentityClaim | undefined;
    private _getEncryptionKey: () => string;
    private _encryption: typeof encryption.Encryption = encryption.Encryption;

    constructor(openPayObj: IOpenPayClaim = {} as IOpenPayClaim, options: openPayOptions) {
        if (!options.getEncryptionKey) { throw new Error((`Missing encryptionKey method!`)); }
        this._getEncryptionKey = options.getEncryptionKey;
        if (options.encryption) { this._encryption = options.encryption; }

        // log.debug(`OpenPayObj provided:`, openPayObj)
        this.virtualAddress = openPayObj.virtualAddress || undefined;
        this.identitySecrets = openPayObj.identitySecrets || undefined;

        log.info(`PayIDClaim initialised`);
    }

    public encrypt = async (encryptionKey?: string): Promise<void> => {
        log.debug(`Encrypting PayIDClaim`);
        if (!this._isEncrypted()) {
            if (!encryptionKey) {
                encryptionKey = await this._getEncryptionKey();
            }
            const encryptionKeyDigest = await this._encryption.digest(encryptionKey);
            this.identitySecrets = JSON.stringify(await this._encryption.encryptJSON(this.identitySecrets as object, encryptionKeyDigest));
        }
    }

    public decrypt = async (encryptionKey?: string): Promise<void> => {
        log.debug(`Decrypting PayIDClaim`);
        if (this._isEncrypted()) {
            // Decrypt the identitySecrets
            const encryptedObj = JSON.parse(this.identitySecrets as string);
            if (!encryptionKey) {
                encryptionKey = await this._getEncryptionKey();
            }
            const encryptionKeyDigest = await this._encryption.digest(encryptionKey);
            this.identitySecrets = (await this._encryption.decryptJSON(encryptedObj.encBuffer, encryptedObj.iv, encryptionKeyDigest) as nameservice.IIdentityClaim);
        }
    }

    public toJSON = (): IOpenPayClaim => {
        // await this.encrypt()
        const json = JSON.parse(JSON.stringify({
            identitySecrets: this.identitySecrets,
            virtualAddress: this.virtualAddress,
        }));
        return json;
    }

    public save = async (storage: storage.StorageService): Promise<void> => {
        const json = await this.toJSON();
        // log.debug(`PayIDClaim being stored to storage:`, json)
        storage.setJSON("payIDClaim", json);
    }

    private _isEncrypted = (): boolean => {
        return typeof this.identitySecrets !== "object";
    }

}

class OpenPayPeer extends EventEmitter {
    public walletClientName: string;
    protected _options: IOpenPayPeerOptions;
    protected _getEncryptionKey: () => string;

    protected _storage: storage.StorageService;
    protected _encryption: typeof encryption.Encryption;
    protected _nameservice: nameservice.NameService | undefined;
    protected _assetList: object | undefined;
    protected _clientMapping: object | undefined;
    protected _payIDClaim: PayIDClaim | undefined;

    constructor(_options: IOpenPayPeerOptions) {
        super();

        this._options = Object.assign({}, _options);
        // TODO: Need to validate options

        this._getEncryptionKey = _options.getEncryptionKey;
        // log.debug(`Encryption key:`, this._getEncryptionKey())

        // Setting up the default modules as fallbacks
        this._storage =  this._options.storage || new storage.LocalStorage();
        this._encryption = this._options.encryption || encryption.Encryption;
        this._nameservice = this._options.nameservice;
        this.walletClientName = this._options.walletClientName;

        log.info(`Config mode:`, config.CONFIG_MODE);
        log.info(`OpenPayPeer Initialised`);
    }

    public async init() {
        console.group("Initialising OpenPayPeer");
        const configService = new BlockstackConfigurationService(this.walletClientName);
        await configService.init();
        if (!this._nameservice) {
            this._nameservice = await configService.getBlockstackServiceForConfig(this.walletClientName);
        }

        if (this._hasPayIDClaimStored()) {
            const payIDClaim = this._storage.getJSON("payIDClaim");
            // log.debug(`Local payIDClaim:`, payIDClaim)
            this._setPayIDClaim(new PayIDClaim(payIDClaim as IOpenPayClaim, { getEncryptionKey: this._getEncryptionKey }));
            await this._restoreIdentity();
        } else {
            const identityClaim = await (this._nameservice as nameservice.NameService).generateIdentity();
            const payIDClaim = {identitySecrets: identityClaim.secrets};
            this._setPayIDClaim(new PayIDClaim(payIDClaim as IOpenPayClaim, { getEncryptionKey: this._getEncryptionKey }));
            log.debug(`Allocated temporary identitySecrets and payIDClaim`);
        }
        this._assetList = await configService.getGlobalAssetList();
        this._clientMapping = await configService.getClientAssetMapping(this.walletClientName);

        log.debug(`global asset list is:- `, this._assetList);
        log.debug(`client asset mapping is:- `, this._clientMapping);
        console.groupEnd();
        log.info(`OpenPayPeer: Done init`);
    }

    public hasPayIDClaim = (): boolean =>  {
        return Boolean(this._payIDClaim);
    }

    public getPayIDClaim = (): PayIDClaim => {
        return (this._payIDClaim as PayIDClaim);
    }

    public registerCruxID = async (virtualAddress: string): Promise<void> => {}

    public updatePassword = async (oldEncryptionKey: string, newEncryptionKey: string): Promise<boolean> => {
        try {
            if (this._hasPayIDClaimStored()) {
                await (this._payIDClaim as PayIDClaim).decrypt(oldEncryptionKey);
                await (this._payIDClaim as PayIDClaim).encrypt(newEncryptionKey);
                await (this._payIDClaim as PayIDClaim).save(this._storage);
                return true;
            } else {
                return false;
            }
        } catch (error) {
            throw FailedUpdatePasswordError.fromError(error);
        }
    }

    public isCruxIDAvailable = (cruxIDSubdomain: string): Promise<boolean> => {
        try {
            identityUtils.CruxId.validateSubdomain(cruxIDSubdomain)
            return (this._nameservice as nameservice.NameService).getNameAvailability(cruxIDSubdomain);
        } catch (error) {
            throw FailedUpdatePasswordError.fromError(error);
        }
    }

    public resolveCurrencyAddressForCruxID = async (fullCruxID: string, walletCurrencySymbol: string): Promise<IAddress> => {
        try {
            console.groupCollapsed("Resolving address");
            let correspondingAssetId: string = "";
            for (const i in this._clientMapping) {
                if (i === walletCurrencySymbol) {
                    // @ts-ignore
                    correspondingAssetId = this._clientMapping[i];
                }
            }
            if (!correspondingAssetId) {
                console.groupEnd();
                throw new Errors.PackageErrors.AssetIDNotAvailable("Asset ID doesn\'t exist in client mapping")
            }

            const addressMap = await (this._nameservice as nameservice.NameService).getAddressMapping(fullCruxID);
            log.debug(`Address map: `, addressMap);
            if (!addressMap[correspondingAssetId]) {
                console.groupEnd();
                throw new Errors.PackageErrors.AddressNotAvailable("Currency address not available for user");
            }
            const address: IAddress = addressMap[correspondingAssetId] || addressMap[correspondingAssetId.toLowerCase()];
            log.debug(`Address:`, address);
            console.groupEnd();
            return address;
        } catch (error) {
            throw FailedToResolveCurrencyAddressForCruxIDError.fromError(error);
        }
    }

    protected _setPayIDClaim = (payIDClaim: PayIDClaim): void => {
        this._payIDClaim = payIDClaim;
    }

    private _restoreIdentity = async () => {
        // if have local identitySecret, setup with the nameservice module
        if ( this._payIDClaim && this._payIDClaim.identitySecrets ) {
            await this._payIDClaim.decrypt();
            try {
                const identityClaim = await (this._nameservice as nameservice.NameService).restoreIdentity(this._payIDClaim.virtualAddress as string, {identitySecrets: this._payIDClaim.identitySecrets});
                (this._payIDClaim as PayIDClaim).identitySecrets = identityClaim.secrets;
                log.info(`Identity restored`);
            } finally {
                log.debug("finally block");
                await (this._payIDClaim as PayIDClaim).encrypt();
                await (this._payIDClaim as PayIDClaim).save(this._storage);
            }
        } else {
            log.info(`payIDClaim or identitySecrets not available! Identity restoration skipped`);
        }
    }

    private _hasPayIDClaimStored = (): boolean => {
        const payIDClaim = this._storage.getJSON("payIDClaim");
        return Boolean(payIDClaim);
    }

}

export namespace CruxClientErrorNames {
    export const FAILED_TO_REGISTER_CRUX_ID: string = 'FAILED_TO_REGISTER_CRUX_ID';
    export const FAILED_TO_CHECK_CRUX_ID_AVAILABLE: string = 'FAILED_TO_CHECK_CRUX_ID_AVAILABLE';
    export const FAILED_TO_RESOLVE_CURRENCY_ADDRESS_FOR_CRUX_ID: string = 'FAILED_TO_RESOLVE_CURRENCY_ADDRESS_FOR_CRUX_ID';
    export const FAILED_TO_GET_ADDRESS_MAP: string = 'FAILED_TO_GET_ADDRESS_MAP';
    export const FAILED_TO_PUT_ADDRESS_MAP: string = 'FAILED_TO_PUT_ADDRESS_MAP';
    export const FAILED_TO_GET_CRUX_ID_STATE: string = 'FAILED_TO_GET_CRUX_ID_STATE';
    export const FAILED_TO_UPDATE_PASSWORD: string = 'FAILED_TO_UPDATE_PASSWORD';
}

export class CruxClientError extends Error {

    public static FALLBACK_ERROR_CODE: number = 9000;
    public static FALLBACK_ERROR_NAME: string = "CruxClientError";
    public error_code: number;

    constructor(error_message: string, error_code?: number | undefined) {
        let message = error_message || "";
        super(message);
        this.name = CruxClientError.FALLBACK_ERROR_NAME;
        this.error_code = error_code || CruxClientError.FALLBACK_ERROR_CODE;
        Object.setPrototypeOf(this, new.target.prototype);
    }

    public static fromError(error: CruxClientError | Errors.PackageError | Error | string, messagePrefix?: string): CruxClientError {

        const msgPrefix: string = messagePrefix === undefined ? '' : messagePrefix + ' : ';
        if (error instanceof CruxClientError ) {
            if (error.message !== undefined) {
                error.message = msgPrefix + error.message;
            }
            return error;
        } else if (typeof(error) === 'string') {
            return new CruxClientError( msgPrefix + error);
        }  else if (error instanceof Errors.PackageError) {
            return new CruxClientError(msgPrefix + error.message, error.error_code);
        } else if (error instanceof Error) {
            return new CruxClientError(msgPrefix + error.message);
        } else {
            throw new Error(`Wrong instance type: ${typeof(error)}`);
        }
    }
}

class FailedToCheckCruxIDAvailableError extends CruxClientError {

    public static FALLBACK_ERROR_CODE: number = 9001;
    public static FALLBACK_ERROR_NAME: string = CruxClientErrorNames.FAILED_TO_CHECK_CRUX_ID_AVAILABLE;

    constructor(error_message: string, error_code?: number | undefined) {
        super(error_message, error_code);
        this.name = FailedToCheckCruxIDAvailableError.FALLBACK_ERROR_NAME;
        this.error_code = FailedToCheckCruxIDAvailableError.FALLBACK_ERROR_CODE;
    }
}

class FailedToRegisterCruxIDError extends CruxClientError {

    public static FALLBACK_ERROR_CODE: number = 9002;
    public static FALLBACK_ERROR_NAME: string = CruxClientErrorNames.FAILED_TO_REGISTER_CRUX_ID;

    constructor(error_message: string, error_code?: number | undefined) {
        super(error_message, error_code);
        this.name = FailedToRegisterCruxIDError.FALLBACK_ERROR_NAME;
        this.error_code = FailedToRegisterCruxIDError.FALLBACK_ERROR_CODE;
    }
}

class FailedToResolveCurrencyAddressForCruxIDError extends CruxClientError {

    public static FALLBACK_ERROR_CODE: number = 9003;
    public static FALLBACK_ERROR_NAME: string = CruxClientErrorNames.FAILED_TO_RESOLVE_CURRENCY_ADDRESS_FOR_CRUX_ID;

    constructor(error_message: string, error_code?: number | undefined) {
        super(error_message, error_code);
        this.name = FailedToResolveCurrencyAddressForCruxIDError.FALLBACK_ERROR_NAME;
        this.error_code = FailedToResolveCurrencyAddressForCruxIDError.FALLBACK_ERROR_CODE;
    }
}

class FailedToGetAddressMapError extends CruxClientError {

    public static FALLBACK_ERROR_CODE: number = 9004;
    public static FALLBACK_ERROR_NAME: string = CruxClientErrorNames.FAILED_TO_GET_ADDRESS_MAP;

    constructor(error_message: string, error_code?: number | undefined) {
        super(error_message, error_code);
        this.name = FailedToGetAddressMapError.FALLBACK_ERROR_NAME;
        this.error_code = FailedToGetAddressMapError.FALLBACK_ERROR_CODE;
    }
}

class FailedToPutAddressMapError extends CruxClientError {

    public static FALLBACK_ERROR_CODE: number = 9005;
    public static FALLBACK_ERROR_NAME: string = CruxClientErrorNames.FAILED_TO_PUT_ADDRESS_MAP;

    constructor(error_message: string, error_code?: number | undefined) {
        super(error_message, error_code);
        this.name = FailedToPutAddressMapError.FALLBACK_ERROR_NAME;
        this.error_code = FailedToPutAddressMapError.FALLBACK_ERROR_CODE;
    }
}

class FailedToGetCruxIDStateError extends CruxClientError {

    public static FALLBACK_ERROR_CODE: number = 9006;
    public static FALLBACK_ERROR_NAME: string = CruxClientErrorNames.FAILED_TO_GET_CRUX_ID_STATE;

    constructor(error_message: string, error_code?: number | undefined) {
        super(error_message, error_code);
        this.name = FailedToGetCruxIDStateError.FALLBACK_ERROR_NAME;
        this.error_code = FailedToGetCruxIDStateError.FALLBACK_ERROR_CODE;
    }
}

class FailedUpdatePasswordError extends CruxClientError {

    public static FALLBACK_ERROR_CODE: number = 9007;
    public static FALLBACK_ERROR_NAME: string = CruxClientErrorNames.FAILED_TO_UPDATE_PASSWORD;

    constructor(error_message: string, error_code?: number | undefined) {
        super(error_message, error_code);
        this.name = FailedUpdatePasswordError.FALLBACK_ERROR_NAME;
        this.error_code = FailedUpdatePasswordError.FALLBACK_ERROR_CODE;
    }
}

// Wallets specific SDK code
export class CruxClient extends OpenPayPeer {
    // NameService specific methods
    public getCruxIDState = async (): Promise<ICruxIDState> => {
        try {
            const fullCruxID = this.hasPayIDClaim() ? this.getPayIDClaim().virtualAddress : undefined;
            const status = await this.getIDStatus();
            return {
                cruxID: fullCruxID,
                status,
            };
        } catch (error) {
            throw FailedUpdatePasswordError.fromError(error);
        }
    }

    private getIDStatus = async (): Promise<nameservice.CruxIDRegistrationStatus> => {
        await (this._payIDClaim as PayIDClaim).decrypt();
        const result = (this._nameservice as nameservice.NameService).getRegistrationStatus({secrets: (this._payIDClaim as PayIDClaim).identitySecrets});
        await (this._payIDClaim as PayIDClaim).encrypt();
        return result;
    }

    public registerCruxID = async (cruxIDSubdomain: string, newAddressMap?: IAddressMapping): Promise<void> => {
        // TODO: add isCruxIDAvailable check before
        try {
            //Subdomain validation
            identityUtils.CruxId.validateSubdomain(cruxIDSubdomain)

            // Generating the identityClaim
            await (this._payIDClaim as PayIDClaim).decrypt();
            const identityClaim = this._payIDClaim ? {secrets: this._payIDClaim.identitySecrets} : await (this._nameservice as nameservice.NameService).generateIdentity();
            const registeredPublicID = await (this._nameservice as nameservice.NameService).registerName(identityClaim, cruxIDSubdomain);

            // Setup the payIDClaim locally
            this._setPayIDClaim(new PayIDClaim({virtualAddress: registeredPublicID, identitySecrets: identityClaim.secrets}, { getEncryptionKey: this._getEncryptionKey }));
            // await this._payIDClaim.setPasscode(passcode)
            await (this._payIDClaim as PayIDClaim).encrypt();
            await (this._payIDClaim as PayIDClaim).save(this._storage);

            // TODO: Setup public addresses
            if (newAddressMap) {
                log.debug(`Selected addresses for resolving via your ID: ${
                    Object.keys(newAddressMap).map((currency) => {
                        return `\n${newAddressMap[currency].addressHash}`;
                    })
                }`);
                await this.putAddressMap(newAddressMap);
            }
        } catch (error) {
            throw FailedUpdatePasswordError.fromError(error);
        }
    }

    public putAddressMap = async (newAddressMap: IAddressMapping): Promise<boolean> => {
        try {
            const clientMapping: any = this._clientMapping;
            const csAddressMap: any = {};
            for (const key of Object.keys(newAddressMap)) {
                csAddressMap[clientMapping[key]] = newAddressMap[key];
            }

            await (this._payIDClaim as PayIDClaim).decrypt();
            const acknowledgement = await (this._nameservice as nameservice.NameService).putAddressMapping({secrets: (this._payIDClaim as PayIDClaim).identitySecrets}, csAddressMap);
            await (this._payIDClaim as PayIDClaim).encrypt();

            if (!acknowledgement) { throw new CruxClientError(`Could not update the addressMap`); }
            return acknowledgement;
        } catch (error) {
            throw FailedUpdatePasswordError.fromError(error);
        }
    }

    public getAddressMap = async (): Promise<IAddressMapping> => {
        try {
            const clientMapping: any = this._clientMapping;
            const clientIdToAssetIdMap: any = {};
            for (const i of Object.keys(clientMapping)) {
                clientIdToAssetIdMap[clientMapping[i]] = i;
            }

            const clientIdMap: any = {};
            if (this._payIDClaim && this._payIDClaim.virtualAddress) {
                const assetIdMap = await (this._nameservice as nameservice.NameService).getAddressMapping(this._payIDClaim.virtualAddress);

                for (const key of Object.keys(assetIdMap)) {
                    clientIdMap[clientIdToAssetIdMap[key]] = assetIdMap[key];
                }
                return clientIdMap;

            } else {
                return {};
            }
        } catch (error) {
            throw FailedUpdatePasswordError.fromError(error);
        }
    }

}

export {
    Errors,
    encryption,
    storage,
    nameservice,
};
