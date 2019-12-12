import "regenerator-runtime/runtime";
import config from "./config";
// Importing packages
import {
    blockstackService,
    configurationService,
    encryption,
    errors,
    identityUtils,
    nameService,
    storage,
    utils,
} from "./packages";
import { getLogger } from "./packages/logger";
import { getCruxIDByAddress } from "./packages/name-service/utils";

const log = getLogger(__filename);

// Setup cache storage
export let cacheStorage: storage.StorageService;

export {
    encryption,
    errors,
    storage,
    nameService,
    blockstackService,
};

// TODO: Implement classes enforcing the interfaces
export interface IAddress {
    addressHash: string;
    secIdentifier?: string;
}

export interface IAddressMapping {
    [currency: string]: IAddress;
}

export interface IPutAddressMapSuccess {
    [currency: string]: IAddress;
}

export interface IPutAddressMapFailures {
    [currency: string]: string;
}

export class AddressMapping {
    constructor(values: IAddressMapping | any = {}) {
        Object.assign(this, values);
    }
    public toJSON() {
        return Object.assign({}, this);
    }
}

export interface ICruxPayPeerOptions {
    getEncryptionKey: () => string;
    privateKey?: string;
    storage?: storage.StorageService;
    encryption?: typeof encryption.Encryption;
    nameService?: nameService.NameService;
    walletClientName: string;
}

interface ICruxPayClaim {
    virtualAddress?: string;
    identitySecrets?: string | any;
}

export interface ICruxIDState {
    cruxID: string | null;
    status: nameService.CruxIDRegistrationStatus;
}

interface payIDClaimOptions {
    getEncryptionKey: () => string;
    encryption?: typeof encryption.Encryption;
}

export class PayIDClaim implements ICruxPayClaim {

    public virtualAddress?: string;
    public identitySecrets?: string | object;
    private _getEncryptionKey: () => string;
    private _encryption: typeof encryption.Encryption = encryption.Encryption;

    constructor(cruxPayObj: ICruxPayClaim = {} as ICruxPayClaim, options: payIDClaimOptions) {
        if (!options.getEncryptionKey) { throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.ExpectedEncryptionKeyValue); }
        this._getEncryptionKey = options.getEncryptionKey;
        if (options.encryption) { this._encryption = options.encryption; }

        // log.debug(`CruxPayObj provided:`, cruxPayObj)
        this.virtualAddress = cruxPayObj.virtualAddress || undefined;
        this.identitySecrets = cruxPayObj.identitySecrets || undefined;

        log.info(`PayIDClaim initialised`);
    }

    public encrypt = async (encryptionKey?: string): Promise<void> => {
        log.debug(`Encrypting PayIDClaim`);
        if (!this._isEncrypted()) {
            if (!encryptionKey) {
                encryptionKey = await this._getEncryptionKey();
            }
            this.identitySecrets = JSON.stringify(await this._encryption.encryptJSON(this.identitySecrets as object, encryptionKey));
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
            this.identitySecrets = (await this._encryption.decryptJSON(encryptedObj.encBuffer, encryptedObj.iv, encryptionKey) as nameService.IIdentityClaim);
        }
    }

    public toJSON = (): Promise<ICruxPayClaim> => {
        const json = JSON.parse(JSON.stringify({
            identitySecrets: this.identitySecrets,
            virtualAddress: this.virtualAddress,
        }));
        return json;
    }

    public save = async (storageService: storage.StorageService): Promise<void> => {
        await this.encrypt();
        const json = this.toJSON();
        // log.debug(`PayIDClaim being stored to storage:`, json)
        await storageService.setJSON("payIDClaim", json);
    }

    private _isEncrypted = (): boolean => {
        return typeof this.identitySecrets !== "object";
    }

}

export class CruxClient {
    public static validateCruxIDByWallet = (walletClientName: string, cruxIDString: string): void => {
        const cruxID = identityUtils.CruxId.fromString(cruxIDString);
        if (cruxID.components.domain !== walletClientName) {
            throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.DifferentWalletCruxID);
        }
    }

    public walletClientName: string;
    protected _options: ICruxPayPeerOptions;
    protected _getEncryptionKey: () => string;
    protected _keyPair?: blockstackService.IBitcoinKeyPair;
    protected _storage: storage.StorageService;
    protected _encryption: typeof encryption.Encryption;
    protected _nameService?: nameService.NameService;
    protected _payIDClaim?: PayIDClaim;
    protected _configService?: configurationService.ConfigurationService;
    private initPromise: Promise<void>;

    constructor(options: ICruxPayPeerOptions) {
        this._options = Object.assign({}, options);
        // TODO: Need to validate options

        if (this._options.getEncryptionKey) {
            this._getEncryptionKey = this._options.getEncryptionKey;
        } else {
            const encryptionKeyConst = utils.getRandomHexString();
            this._getEncryptionKey = (): string => encryptionKeyConst;
        }
        // log.debug(`Encryption key:`, this._getEncryptionKey())

        // Setting up the default modules as fallbacks
        this._storage =  this._options.storage || new storage.LocalStorage();
        this._encryption = this._options.encryption || encryption.Encryption;
        this._nameService = this._options.nameService;
        if (this._options.privateKey) { this._keyPair =  utils.getKeyPairFromPrivKey(this._options.privateKey); }
        this.walletClientName = this._options.walletClientName;

        // Assigning cacheStorage
        cacheStorage = this._storage;

        log.info(`Config mode:`, config.CONFIG_MODE);
        log.info(`CruxPayClient: constructor called`);
        this.initPromise = this._init();
    }

    public init = async (): Promise<void> => {
        return await this.initPromise;
    }   // For backward compatibility

    public hasPayIDClaim = (): boolean =>  {
        return Boolean(this._payIDClaim);
    }

    public getPayIDClaim = (): PayIDClaim => {
        return (this._payIDClaim as PayIDClaim);
    }

    public updatePassword = async (oldEncryptionKey: string, newEncryptionKey: string): Promise<boolean> => {
        await this.initPromise;
        try {
            if (await this._hasPayIDClaimStored()) {
                await (this._payIDClaim as PayIDClaim).decrypt(oldEncryptionKey);
                try {
                    await (this._payIDClaim as PayIDClaim).encrypt(newEncryptionKey);
                } catch (err) {
                    await (this._payIDClaim as PayIDClaim).encrypt(oldEncryptionKey);
                    return false;
                }
                await (this._payIDClaim as PayIDClaim).save(this._storage);
                return true;
            } else {
                return true;
            }
        } catch (err) {
            throw errors.CruxClientError.fromError(err);
        }
    }

    public isCruxIDAvailable = async (cruxIDSubdomain: string): Promise<boolean> => {
        await this.initPromise;
        try {
                identityUtils.validateSubdomain(cruxIDSubdomain);
                return (this._nameService as nameService.NameService).getNameAvailability(cruxIDSubdomain);
            } catch (err) {
                throw errors.CruxClientError.fromError(err);
            }
    }

    public resolveCurrencyAddressForCruxID = async (fullCruxID: string, walletCurrencySymbol: string): Promise<IAddress> => {
        await this.initPromise;
        try {
                if (!(this._configService && this._nameService)) {
                    throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.ClientNotInitialized);
                }
                walletCurrencySymbol = walletCurrencySymbol.toLowerCase();
                let correspondingAssetId: string = "";
                const tag = "?resolving_address";
                correspondingAssetId = await this._translateSymbolToAssetId(walletCurrencySymbol);
                if (!correspondingAssetId) {
                    throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.AssetIDNotAvailable);
                }

                const addressMap = await this._nameService.getAddressMapping(fullCruxID, tag);
                log.debug(`Address map: `, addressMap);
                if (!addressMap[correspondingAssetId]) {
                    throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.AddressNotAvailable);
                }
                const address: IAddress = addressMap[correspondingAssetId] || addressMap[correspondingAssetId.toLowerCase()];
                log.debug(`Address:`, address);
                return address;
            } catch (err) {
                throw errors.CruxClientError.fromError(err);
            }
    }

    public getCruxIDState = async (): Promise<ICruxIDState> => {
        await this.initPromise;
        try {
            const fullCruxID = this.hasPayIDClaim() ? this.getPayIDClaim().virtualAddress : undefined;
            if (!fullCruxID) {
                return {
                    cruxID: null,
                    status: {
                        status: "NONE",
                        statusDetail: "",
                    },
                };
            }
            const status = await this._getIDStatus();
            return {
                cruxID: fullCruxID,
                status,
            };
        } catch (err) {
            throw errors.CruxClientError.fromError(err);
        }
    }

    public registerCruxID = async (cruxIDSubdomain: string): Promise<void> => {
        // TODO: add isCruxIDAvailable check before
        await this.initPromise;
        try {
                // Subdomain validation
                identityUtils.validateSubdomain(cruxIDSubdomain);

                // Validate if the subdomain is available
                if (!(await this.isCruxIDAvailable(cruxIDSubdomain))) {
                    throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.CruxIDUnavailable, cruxIDSubdomain);
                }

                // Generating the identityClaim
                if (this._payIDClaim) {
                    if (this._payIDClaim.virtualAddress) {
                        // Do not allow multiple registrations using same payIDClaim
                        throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.ExistingCruxIDFound, this._payIDClaim.virtualAddress);
                    }
                    await (this._payIDClaim as PayIDClaim).decrypt();
                }

                let identityClaim: nameService.IIdentityClaim;
                if (this._payIDClaim) {
                    identityClaim = {secrets: this._payIDClaim.identitySecrets};
                } else if (this._keyPair) {
                    identityClaim = {secrets: {identityKeyPair: this._keyPair}};
                } else {
                    identityClaim = await (this._nameService as nameService.NameService).generateIdentity(this._storage, await this._getEncryptionKey());
                }

                const registeredPublicID = await (this._nameService as nameService.NameService).registerName(identityClaim, cruxIDSubdomain);

                // Setup the payIDClaim locally
                this._setPayIDClaim(new PayIDClaim({virtualAddress: registeredPublicID, identitySecrets: identityClaim.secrets}, { getEncryptionKey: this._getEncryptionKey }));
                // await this._payIDClaim.setPasscode(passcode)
                await (this._payIDClaim as PayIDClaim).encrypt();
                await (this._payIDClaim as PayIDClaim).save(this._storage);
                return;
            } catch (err) {
                throw errors.CruxClientError.fromError(err);
            }
    }

    public putAddressMap = async (newAddressMap: IAddressMapping): Promise<{success: IPutAddressMapSuccess, failures: IPutAddressMapFailures}> => {
        await this.initPromise;
        try {
                const {assetAddressMap, success, failures} = await this._getAssetAddressMapFromCurrencyAddressMap(newAddressMap);
                await (this._payIDClaim as PayIDClaim).decrypt();
                await (this._nameService as nameService.NameService).putAddressMapping({secrets: (this._payIDClaim as PayIDClaim).identitySecrets}, assetAddressMap);
                await (this._payIDClaim as PayIDClaim).encrypt();
                return {success, failures};
            } catch (err) {
                throw errors.CruxClientError.fromError(err);
            }
    }

    public getAddressMap = async (): Promise<IAddressMapping> => {
        await this.initPromise;
        try {
                const currencyAddressMap: IAddressMapping = {};
                if (this._payIDClaim && this._payIDClaim.virtualAddress && this._configService) {
                    const userAssetIdToAddressMap = await (this._nameService as nameService.NameService).getAddressMapping(this._payIDClaim.virtualAddress);

                    for (const assetId of Object.keys(userAssetIdToAddressMap)) {
                        currencyAddressMap[(await (this._translateAssetIdToSymbol(assetId)))] = userAssetIdToAddressMap[assetId];
                    }
                    return currencyAddressMap;
                } else {
                    return {};
                }
            } catch (err) {
                if (err.errorCode && err.errorCode === errors.PackageErrorCode.GaiaEmptyResponse) {
                    return {};
                }
                throw errors.CruxClientError.fromError(err);
            }
    }

    public getAssetMap = async (): Promise<configurationService.IResolvedClientAssetMap> => {
        await this.initPromise;
        try {
                // @ts-ignore
                return this._configService.resolvedClientAssetMap as configurationService.IResolvedClientAssetMap;
            } catch (err) {
                throw errors.CruxClientError.fromError(err);
            }
    }

    public getAssetMapping = () => this.getAssetMap;    // For backward compatibility

    protected _setPayIDClaim = (payIDClaim: PayIDClaim): void => {
        this._payIDClaim = payIDClaim;
        delete this._keyPair;
    }

    private _init = async (): Promise<void> => {
        await this._setupConfigService();
        if (!this._configService) {
            throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.ClientNotInitialized);
        }
        if (await this._hasPayIDClaimStored()) {
            log.debug("using the stored payIDClaim");
            const payIDClaim = (await this._storage.getJSON("payIDClaim") as ICruxPayClaim);
            // log.debug(`Local payIDClaim:`, payIDClaim)

            // if a keyPair is provided, add a validation check on the cruxID stored
            if (this._keyPair) {
                const registeredCruxID = await getCruxIDByAddress(this.walletClientName, this._keyPair.address, this._configService.getBnsNodes(), this._configService.getSubdomainRegistrar());
                if (registeredCruxID) {
                    CruxClient.validateCruxIDByWallet(this.walletClientName, registeredCruxID);
                    if (registeredCruxID !== payIDClaim.virtualAddress) {
                        throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.KeyPairMismatch);
                    }
                } else {
                    throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.KeyPairMismatch);
                }
            }
            this._setPayIDClaim(new PayIDClaim(payIDClaim, { getEncryptionKey: this._getEncryptionKey }));
        } else if (this._keyPair) {
            log.debug("using the keyPair provided");
            const registeredCruxID = await getCruxIDByAddress(this.walletClientName, this._keyPair.address, this._configService.getBnsNodes(), this._configService.getSubdomainRegistrar());
            if (registeredCruxID) {
                CruxClient.validateCruxIDByWallet(this.walletClientName, registeredCruxID);
                const payIDClaim = {identitySecrets: {identityKeyPair: this._keyPair}, virtualAddress: registeredCruxID || undefined};
                this._setPayIDClaim(new PayIDClaim(payIDClaim, { getEncryptionKey: this._getEncryptionKey }));
            }
        }

        await this._initializeNameService().then(() => this._restoreIdentity());

        log.info(`CruxPayClient: _init complete`);
    }

    private _getIDStatus = async (): Promise<nameService.CruxIDRegistrationStatus> => {
        await (this._payIDClaim as PayIDClaim).decrypt();
        const result = await (this._nameService as nameService.NameService).getRegistrationStatus({secrets: (this._payIDClaim as PayIDClaim).identitySecrets});
        await (this._payIDClaim as PayIDClaim).encrypt();
        return result;
    }

    private _getAssetAddressMapFromCurrencyAddressMap = async (currencyAddressMap: IAddressMapping): Promise<{success: IPutAddressMapSuccess, failures: IPutAddressMapFailures, assetAddressMap: IAddressMapping}> => {
        const lowerCurrencyAddressMap = Object.assign({}, currencyAddressMap);
        const assetAddressMap: IAddressMapping = {};
        const success: IPutAddressMapSuccess = {};
        const failures: IPutAddressMapFailures = {};
        for (let walletCurrencySymbol of Object.keys(lowerCurrencyAddressMap)) {
            lowerCurrencyAddressMap[walletCurrencySymbol.toLowerCase()] = lowerCurrencyAddressMap[walletCurrencySymbol];
            walletCurrencySymbol = walletCurrencySymbol.toLowerCase();
            const assetId = await this._translateSymbolToAssetId(walletCurrencySymbol);
            if (assetId) {
                assetAddressMap[assetId] = lowerCurrencyAddressMap[walletCurrencySymbol];
                success[walletCurrencySymbol] = lowerCurrencyAddressMap[walletCurrencySymbol];
            } else {
                failures[walletCurrencySymbol] = `${errors.PackageErrorCode.CurrencyDoesNotExistInClientMapping}: ${errors.ERROR_STRINGS[errors.PackageErrorCode.CurrencyDoesNotExistInClientMapping]}`;
            }
        }
        return {
            assetAddressMap,
            failures,
            success,
        };
    }

    private _setupConfigService = async (): Promise<void> => {
        if (!this._configService) {
            this._configService = new configurationService.ConfigurationService(this.walletClientName);
            await this._configService.init();
        }
    }

    private _initializeNameService = async () => {
        if (!this._configService) {
            throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.ClientNotInitialized);
        }
        if (!this._nameService) {
            let nameServiceConfig: blockstackService.IBlockstackServiceInputOptions;
            if (this._payIDClaim && this._payIDClaim.virtualAddress) {
                await this._payIDClaim.decrypt();
                nameServiceConfig = await this._configService.getBlockstackServiceConfig(this._payIDClaim.virtualAddress, {secrets: this._payIDClaim.identitySecrets});
                await this._payIDClaim.encrypt();
            } else {
                nameServiceConfig = await this._configService.getBlockstackServiceConfig();
            }
            this._nameService = new blockstackService.BlockstackService(nameServiceConfig);
        }
    }

    private _restoreIdentity = async () => {
        // if have local identitySecret, setup with the nameService module
        if ( this._payIDClaim && this._payIDClaim.identitySecrets ) {
            await this._payIDClaim.decrypt();
            try {
                const identityClaim = await (this._nameService as nameService.NameService).restoreIdentity(this._payIDClaim.virtualAddress as string, {secrets: this._payIDClaim.identitySecrets});
                (this._payIDClaim as PayIDClaim).identitySecrets = identityClaim.secrets;
                log.info(`Identity restored`);
            } finally {
                log.debug("Encrypting and saving the payIDClaim");
                await (this._payIDClaim as PayIDClaim).encrypt();
                await (this._payIDClaim as PayIDClaim).save(this._storage);
            }
        } else {
            log.info(`payIDClaim or identitySecrets not available! Identity restoration skipped`);
        }
    }

    private _hasPayIDClaimStored = async (): Promise<boolean> => {
        const payIDClaim = await this._storage.getJSON("payIDClaim");
        return Boolean(payIDClaim);
    }

    private _translateSymbolToAssetId = (currencySymbol: string): string => {
        if (!this._configService) {
            throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.ClientNotInitialized);
        }
        return (this._configService.clientAssetMapping as configurationService.IClientAssetMapping)[currencySymbol];
    }

    private _translateAssetIdToSymbol = (assetId: string): string => {
        if (!this._configService) {
            throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.ClientNotInitialized);
        }
        return (this._configService.reverseClientAssetMapping as configurationService.IReverseClientAssetMapping)[assetId];
    }

}
