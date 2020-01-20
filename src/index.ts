import "regenerator-runtime/runtime";
import config from "./config";
// Importing packages
import {
    blockstackService,
    configurationService,
    encryption,
    errors,
    identityUtils,
    inmemStorage,
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
    config,
    encryption,
    errors,
    storage,
    inmemStorage,
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

export interface ICruxClientOptions {
    getEncryptionKey?: () => Promise<string>;
    privateKey?: string;
    cacheStorage?: storage.StorageService;
    encryption?: typeof encryption.Encryption;
    nameService?: nameService.NameService;
    walletClientName: string;
}

interface ICruxPayClaim {
    virtualAddress: string;
    identitySecrets: string | any;
}

export interface ICruxIDState {
    cruxID: string | null;
    status: nameService.CruxIDRegistrationStatus;
}

interface payIDClaimOptions {
    getEncryptionKey: () => Promise<string>;
    encryption?: typeof encryption.Encryption;
}

export class PayIDClaim implements ICruxPayClaim {

    public virtualAddress: string;
    public identitySecrets: string | object;
    private _getEncryptionKey: () => Promise<string>;
    private _encryption: typeof encryption.Encryption = encryption.Encryption;

    constructor(cruxPayObj: ICruxPayClaim, options: payIDClaimOptions) {
        if (!options.getEncryptionKey) { throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.ExpectedEncryptionKeyValue); }
        this._getEncryptionKey = options.getEncryptionKey;
        if (options.encryption) { this._encryption = options.encryption; }

        // log.debug(`CruxPayObj provided:`, cruxPayObj)
        this.virtualAddress = cruxPayObj.virtualAddress;
        this.identitySecrets = cruxPayObj.identitySecrets;

        log.debug(`PayIDClaim initialised`);
    }

    public encrypt = async (encryptionKey?: string): Promise<void> => {
        log.debug(`Encrypting PayIDClaim`);
        if (!this._isEncrypted()) {
            if (!encryptionKey) {
                encryptionKey = await this._getEncryptionKey();
            }
            this.identitySecrets = JSON.stringify(await this._encryption.encryptJSON(this.identitySecrets as object, encryptionKey));
            encryptionKey = undefined;
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
            encryptionKey = undefined;
        }
    }

    public toJSON = (): Promise<ICruxPayClaim> => {
        const json = JSON.parse(JSON.stringify({
            identitySecrets: this.identitySecrets,
            virtualAddress: this.virtualAddress,
        }));
        return json;
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
    protected _getEncryptionKey: () => Promise<string>;
    protected _keyPair?: string;
    protected _encryption: typeof encryption.Encryption;
    protected _nameService?: nameService.NameService;
    protected _payIDClaim?: PayIDClaim;
    protected _configService?: configurationService.ConfigurationService;
    private _authenticated!: boolean;
    private initPromise: Promise<void>;
    private _setKeyPairPromise: Promise<void>;
    private _unencryptedKeyPair?: blockstackService.IBitcoinKeyPair;

    constructor(options: ICruxClientOptions) {
        // TODO: Need to validate options

        if (options.getEncryptionKey) {
            this._getEncryptionKey = options.getEncryptionKey;
        } else {
            const encryptionKeyConst = utils.getRandomHexString();
            this._getEncryptionKey = async (): Promise<string> => encryptionKeyConst;
        }
        // log.debug(`Encryption key:`, this._getEncryptionKey())

        this._encryption = options.encryption || encryption.Encryption;
        this._nameService = options.nameService;
        this.walletClientName = options.walletClientName;

        this._setKeyPairPromise = this._setKeyPair(options.privateKey);
        delete options.privateKey;

        // Assigning cacheStorage
        cacheStorage = options.cacheStorage || new inmemStorage.InMemStorage();

        log.debug(`Config mode:`, config.CONFIG_MODE);
        log.debug(`CruxPayClient: constructor called`);
        this.initPromise = this._init();
    }

    public init = async (): Promise<void> => {
        return await this.initPromise;
    }   // For backward compatibility

    public hasPayIDClaim = (): boolean =>  {
        return Boolean(this._payIDClaim);
    }

    public getPayIDClaim = (): PayIDClaim => {
        return this._getPayIDClaim();
    }

    public isCruxIDAvailable = async (cruxIDSubdomain: string): Promise<boolean> => {
        await this.initPromise;
        try {
                identityUtils.validateSubdomain(cruxIDSubdomain);
                return this._getNameservice().getNameAvailability(cruxIDSubdomain);
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
                const tag = "resolving_address";
                correspondingAssetId = this._translateSymbolToAssetId(walletCurrencySymbol);
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
            if (!this._authenticated) {
                throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.PrivateKeyRequired);
            }
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

    /**
     * ```ts
     *  const sampleAddressMap: IAddressMapping = {
     *      'BTC': {
     *          addressHash: '1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX'
     *      },
     *      'ETH': {
     *          addressHash: '0x7cB57B5A97eAbe94205C07890BE4c1aD31E486A8'
     *      },
     *  }
     *  // Advised to pipe the method putAddressMap to registerCruxID call
     *  await cruxClient.registerCruxID("bob")
     *      .then(() => {
     *          return cruxClient.putAddressMap(sampleAddressMap)
     *              .catch((addressUpdationError) => {
     *                  // Handling addressUpdation error
     *              })
     *      })
     *      .catch((registrationError) => {
     *          // Handling registration error
     *      })
     * ```
     */
    public registerCruxID = async (cruxIDSubdomain: string): Promise<void> => {
        // TODO: add isCruxIDAvailable check before
        await this.initPromise;
        try {
                if (!this._authenticated) {
                    throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.PrivateKeyRequired);
                }
                // Subdomain validation
                identityUtils.validateSubdomain(cruxIDSubdomain);

                // Validate if the subdomain is available
                if (!(await this.isCruxIDAvailable(cruxIDSubdomain))) {
                    throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.CruxIDUnavailable, cruxIDSubdomain);
                }

                // Generating the identityClaim
                if (this._payIDClaim && this._payIDClaim.virtualAddress) {
                    // Do not allow multiple registrations using same payIDClaim
                    throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.ExistingCruxIDFound, this._payIDClaim.virtualAddress);
                }

                let identityClaim: nameService.IIdentityClaim | undefined;
                await this._decryptKeyPair();
                identityClaim = {secrets: {identityKeyPair: Object.assign({}, this._unencryptedKeyPair)}};
                await this._encryptKeyPair();

                const registeredPublicID = await this._getNameservice().registerName(Object.assign({}, identityClaim), cruxIDSubdomain);

                // Setup the payIDClaim locally
                this._setPayIDClaim(new PayIDClaim({virtualAddress: registeredPublicID, identitySecrets: identityClaim.secrets}, { getEncryptionKey: this._getEncryptionKey }));
                identityClaim = undefined;
                // await this._payIDClaim.setPasscode(passcode)
                await this._getPayIDClaim().encrypt();
                return;
            } catch (err) {
                throw errors.CruxClientError.fromError(err);
            }
    }

    public putAddressMap = async (newAddressMap: IAddressMapping): Promise<{success: IPutAddressMapSuccess, failures: IPutAddressMapFailures}> => {
        await this.initPromise;
        try {
                if (!this._authenticated) {
                    throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.PrivateKeyRequired);
                }
                const {assetAddressMap, success, failures} = await this._getAssetAddressMapFromCurrencyAddressMap(newAddressMap);
                await this._getPayIDClaim().decrypt();
                await this._getNameservice().putAddressMapping({secrets: this._getPayIDClaim().identitySecrets}, assetAddressMap);
                await this._getPayIDClaim().encrypt();
                return {success, failures};
            } catch (err) {
                throw errors.CruxClientError.fromError(err);
            }
    }

    public getAddressMap = async (): Promise<IAddressMapping> => {
        await this.initPromise;
        try {
                if (!this._authenticated) {
                    throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.PrivateKeyRequired);
                }
                const currencyAddressMap: IAddressMapping = {};
                if (this._payIDClaim && this._payIDClaim.virtualAddress && this._configService) {
                    const userAssetIdToAddressMap = await this._getNameservice().getAddressMapping(this._payIDClaim.virtualAddress);

                    for (const assetId of Object.keys(userAssetIdToAddressMap)) {
                        currencyAddressMap[this._translateAssetIdToSymbol(assetId)] = userAssetIdToAddressMap[assetId];
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
                return this._configService.resolvedClientAssetMap;
            } catch (err) {
                throw errors.CruxClientError.fromError(err);
            }
    }

    // tslint:disable-next-line: member-ordering
    public getAssetMapping = this.getAssetMap;    // For backward compatibility

    protected _setPayIDClaim = (payIDClaim: PayIDClaim): void => {
        this._payIDClaim = payIDClaim;
        delete this._keyPair;
    }

    private _init = async (): Promise<void> => {
        await this._setupConfigService();
        await this._setKeyPairPromise;
        if (!this._configService) {
            throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.ClientNotInitialized);
        }
        if (this._keyPair) {
            log.debug("using the keyPair provided");
            await this._decryptKeyPair();
            const registeredCruxID = await getCruxIDByAddress(this.walletClientName, (this._unencryptedKeyPair as blockstackService.IBitcoinKeyPair).address, this._configService.getBnsNodes(), this._configService.getSubdomainRegistrar());
            if (registeredCruxID) {
                CruxClient.validateCruxIDByWallet(this.walletClientName, registeredCruxID);
                const payIDClaim = {identitySecrets: {identityKeyPair: Object.assign({}, this._unencryptedKeyPair)}, virtualAddress: registeredCruxID};
                this._setPayIDClaim(new PayIDClaim(payIDClaim, { getEncryptionKey: this._getEncryptionKey }));
            }
            await this._encryptKeyPair();
        }
        await this._initializeNameService().then(() => this._restoreIdentity());

        log.debug(`CruxPayClient: _init complete`);
    }

    private _getIDStatus = async (): Promise<nameService.CruxIDRegistrationStatus> => {
        await this._getPayIDClaim().decrypt();
        const result = await this._getNameservice().getRegistrationStatus({secrets: this._getPayIDClaim().identitySecrets});
        await this._getPayIDClaim().encrypt();
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
            const assetId = this._translateSymbolToAssetId(walletCurrencySymbol);
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
                const identityClaim = await this._getNameservice().restoreIdentity(this._payIDClaim.virtualAddress, {secrets: this._payIDClaim.identitySecrets});
                this._getPayIDClaim().identitySecrets = identityClaim.secrets;
                log.debug(`Identity restored`);
            } finally {
                log.debug("Encrypting and saving the payIDClaim");
                await this._getPayIDClaim().encrypt();
            }
        } else {
            log.debug(`payIDClaim or identitySecrets not available! Identity restoration skipped`);
        }
    }

    private _translateSymbolToAssetId = (currencySymbol: string): string => {
        if (!this._configService) {
            throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.ClientNotInitialized);
        }
        return this._configService.clientAssetMapping[currencySymbol];
    }

    private _translateAssetIdToSymbol = (assetId: string): string => {
        if (!this._configService) {
            throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.ClientNotInitialized);
        }
        return this._configService.reverseClientAssetMapping[assetId];
    }

    private _getPayIDClaim = (): PayIDClaim => {
        if (!this._payIDClaim) {
            throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.PayIDClaimNotFound);
        }
        return this._payIDClaim;
    }

    private _getNameservice = (): nameService.NameService => {
        if (!this._nameService) {
            throw new errors.BaseError(null, "Nameservice not initialized");
        }
        return this._nameService;
    }

    private _setKeyPair = async (privateKey?: string): Promise<void> => {
        if (privateKey) {
            this._keyPair = JSON.stringify(await this._encryption.encryptJSON(utils.getKeyPairFromPrivKey(privateKey), await this._getEncryptionKey()));
            privateKey = undefined;
            this._authenticated = true;
        } else {
            this._authenticated = false;
        }
        return;
    }

    private _encryptKeyPair = async () => {
        if (this._unencryptedKeyPair) {
            this._keyPair = JSON.stringify(await this._encryption.encryptJSON(this._unencryptedKeyPair, await this._getEncryptionKey()));
            for (const key in this._unencryptedKeyPair) {
                if (this._unencryptedKeyPair.hasOwnProperty(key)) {
                    // @ts-ignore
                    delete this._unencryptedKeyPair[key];
                }
            }
            delete this._unencryptedKeyPair;
        }
    }

    private _decryptKeyPair = async () => {
        if (!this._keyPair) {
            throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.PrivateKeyRequired);
        }
        const encryptedKeyPairObject = JSON.parse(this._keyPair.toString());
        this._unencryptedKeyPair = await this._encryption.decryptJSON(encryptedKeyPairObject.encBuffer, encryptedKeyPairObject.iv, await this._getEncryptionKey()) as blockstackService.IBitcoinKeyPair;
    }

}
