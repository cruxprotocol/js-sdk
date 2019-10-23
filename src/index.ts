import Logger from "js-logger";
import path from "path";
import "regenerator-runtime/runtime";
import config from "./config";
import { CRUX_DOMAIN_SUFFIX } from "./packages/identity-utils";

// Setup logging configuration
Logger.useDefaults();
Logger.setLevel(config.CONFIG_MODE === "prod" ? Logger.INFO : Logger.DEBUG);
export function getLogger(filename: string) {
    return Logger.get("CruxPay: " + filename.slice(filename.lastIndexOf(path.sep) + 1, filename.length - 3));
}
const log = getLogger(__filename);

// Importing packages
import {
    blockstackConfigurationService,
    blockstackService,
    encryption,
    errors,
    identityUtils,
    nameService,
    storage,
    utils,
} from "./packages";
import { getCruxIDByAddress } from "./packages/name-service/utils";

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

// SDK core class

export interface ICruxPayPeerOptions {
    getEncryptionKey: () => string;
    privateKey?: string;
    storage?: storage.StorageService;
    encryption?: typeof encryption.Encryption;
    nameService?: nameService.NameService;
    walletClientName: string;
}

interface IIdentitySecrets {
    [nameService: string]: nameService.IIdentityClaim;
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

    public virtualAddress: string | undefined;
    public identitySecrets: string | any | undefined;
    private _getEncryptionKey: () => string;
    private _encryption: typeof encryption.Encryption = encryption.Encryption;

    constructor(cruxPayObj: ICruxPayClaim = {} as ICruxPayClaim, options: payIDClaimOptions) {
        if (!options.getEncryptionKey) { throw errors.ErrorHelper.getPackageError(errors.PackageErrorCode.ExpectedEncryptionKeyValue); }
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
        storageService.setJSON("payIDClaim", json);
    }

    private _isEncrypted = (): boolean => {
        return typeof this.identitySecrets !== "object";
    }

}

class CruxPayPeer {
    public static validateCruxIDByWallet = (walletClientName: string, cruxIDString: string): void => {
        const cruxID = identityUtils.CruxId.fromString(cruxIDString);
        if (cruxID.components.domain !== walletClientName) {
            throw errors.ErrorHelper.getPackageError(errors.PackageErrorCode.DifferentWalletCruxID);
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
    protected _configService?: blockstackConfigurationService.BlockstackConfigurationService;

    constructor(options: ICruxPayPeerOptions) {
        this._options = Object.assign({}, options);
        // TODO: Need to validate options

        this._getEncryptionKey = this._options.getEncryptionKey;
        // log.debug(`Encryption key:`, this._getEncryptionKey())

        // Setting up the default modules as fallbacks
        this._storage =  this._options.storage || new storage.LocalStorage();
        this._encryption = this._options.encryption || encryption.Encryption;
        this._nameService = this._options.nameService;
        if (this._options.privateKey) { this._keyPair =  utils.getKeyPairFromPrivKey(this._options.privateKey); }
        this.walletClientName = this._options.walletClientName;

        log.info(`Config mode:`, config.CONFIG_MODE);
        log.info(`CruxPayPeer Initialised`);
    }

    public async init() {
        await this._setupConfigService();
        const walletNameServiceConfiguration = ((this._configService as blockstackConfigurationService.BlockstackConfigurationService).clientConfig as blockstackConfigurationService.IClientConfig).nameserviceConfiguration as blockstackService.IBlockstackServiceInputOptions;
        const bnsNodes = (walletNameServiceConfiguration && walletNameServiceConfiguration.bnsNodes) ? [...new Set([...config.BLOCKSTACK.BNS_NODES, ...walletNameServiceConfiguration.bnsNodes])] : config.BLOCKSTACK.BNS_NODES;
        const registrar = (walletNameServiceConfiguration && walletNameServiceConfiguration.subdomainRegistrar) || config.BLOCKSTACK.SUBDOMAIN_REGISTRAR;

        if (this._hasPayIDClaimStored()) {
            log.debug("using the stored payIDClaim");
            const payIDClaim = (this._storage.getJSON("payIDClaim") as ICruxPayClaim);
            // log.debug(`Local payIDClaim:`, payIDClaim)

            // if a keyPair is provided, add a validation check on the cruxID stored
            if (this._keyPair) {
                const registeredCruxID = await getCruxIDByAddress(this.walletClientName, this._keyPair.address, bnsNodes, registrar);
                if (registeredCruxID) {
                    CruxPayPeer.validateCruxIDByWallet(this.walletClientName, registeredCruxID);
                    if (registeredCruxID !== payIDClaim.virtualAddress) {
                        throw errors.ErrorHelper.getPackageError(errors.PackageErrorCode.KeyPairMismatch);
                    }
                } else {
                    throw errors.ErrorHelper.getPackageError(errors.PackageErrorCode.KeyPairMismatch);
                }
            }
            this._setPayIDClaim(new PayIDClaim(payIDClaim, { getEncryptionKey: this._getEncryptionKey }));
        } else if (this._keyPair) {
            log.debug("using the keyPair provided");
            const registeredCruxID = await getCruxIDByAddress(this.walletClientName, this._keyPair.address, bnsNodes, registrar);
            if (registeredCruxID) {
                CruxPayPeer.validateCruxIDByWallet(this.walletClientName, registeredCruxID);
                const payIDClaim = {identitySecrets: {identityKeyPair: this._keyPair}, virtualAddress: registeredCruxID || undefined};
                this._setPayIDClaim(new PayIDClaim(payIDClaim, { getEncryptionKey: this._getEncryptionKey }));
            }
        } else {
            log.debug("falling back without any payIDClaim");
        }

        await this._initializeNameService().then(() => this._restoreIdentity());

        log.info(`CruxPayPeer: Done init`);
    }

    public hasPayIDClaim = (): boolean =>  {
        return Boolean(this._payIDClaim);
    }

    public getPayIDClaim = (): PayIDClaim => {
        return (this._payIDClaim as PayIDClaim);
    }

    public updatePassword = async (oldEncryptionKey: string, newEncryptionKey: string): Promise<boolean> => {
        try {
            if (this._hasPayIDClaimStored()) {
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

    public isCruxIDAvailable = (cruxIDSubdomain: string): Promise<boolean> => {
        try {
            identityUtils.validateSubdomain(cruxIDSubdomain);
            return (this._nameService as nameService.NameService).getNameAvailability(cruxIDSubdomain);
        } catch (err) {
            throw errors.CruxClientError.fromError(err);
        }
    }

    public resolveCurrencyAddressForCruxID = async (fullCruxID: string, walletCurrencySymbol: string): Promise<IAddress> => {
        try {
            walletCurrencySymbol = walletCurrencySymbol.toLowerCase();
            let correspondingAssetId: string = "";
            correspondingAssetId = await (this._configService as blockstackConfigurationService.BlockstackConfigurationService).translateSymbolToAssetId(walletCurrencySymbol);
            if (!correspondingAssetId) {
                throw errors.ErrorHelper.getPackageError(errors.PackageErrorCode.AssetIDNotAvailable);
            }

            const addressMap = await (this._nameService as nameService.NameService).getAddressMapping(fullCruxID);
            log.debug(`Address map: `, addressMap);
            if (!addressMap[correspondingAssetId]) {
                throw errors.ErrorHelper.getPackageError(errors.PackageErrorCode.AddressNotAvailable);
            }
            const address: IAddress = addressMap[correspondingAssetId] || addressMap[correspondingAssetId.toLowerCase()];
            log.debug(`Address:`, address);
            return address;
        } catch (err) {
            throw errors.CruxClientError.fromError(err);
        }
    }

    protected _setPayIDClaim = (payIDClaim: PayIDClaim): void => {
        this._payIDClaim = payIDClaim;
    }

    private _setupConfigService = async (): Promise<void> => {
        if (!this._configService) {
            this._configService = new blockstackConfigurationService.BlockstackConfigurationService(this.walletClientName);
            await this._configService.init();
        }
    }

    private _initializeNameService = async () => {
        if (!this._configService) {
            throw new Error("Missing configSerivce.");
        }
        if (!this._nameService) {
            if (this._payIDClaim && this._payIDClaim.virtualAddress) {
                const ns: blockstackService.BlockstackService = new blockstackService.BlockstackService({domain: this.walletClientName + CRUX_DOMAIN_SUFFIX});
                await this._payIDClaim.decrypt();
                await ns.restoreIdentity(this._payIDClaim.virtualAddress as string, {secrets: this._payIDClaim.identitySecrets});
                const status = await ns.getRegistrationStatus({secrets: this._payIDClaim.identitySecrets});
                await this._payIDClaim.encrypt();
                if (status.status === blockstackService.SubdomainRegistrationStatus.DONE) {
                    this._nameService = await this._configService.getBlockstackServiceForConfig(this._payIDClaim.virtualAddress);
                } else {
                    this._nameService = await this._configService.getBlockstackServiceForConfig();
                }
            } else {
                this._nameService = await this._configService.getBlockstackServiceForConfig();
            }
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

// Wallets specific SDK code
export class CruxClient extends CruxPayPeer {
    public getCruxIDState = async (): Promise<ICruxIDState> => {
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
        try {
            // Subdomain validation
            identityUtils.validateSubdomain(cruxIDSubdomain);

            // Validate if the subdomain is available
            if (!(await this.isCruxIDAvailable(cruxIDSubdomain))) {
                throw errors.ErrorHelper.getPackageError(errors.PackageErrorCode.CruxIDUnavailable, cruxIDSubdomain);
            }

            // Generating the identityClaim
            if (this._payIDClaim) {
                if (this._payIDClaim.virtualAddress) {
                    // Do not allow multiple registrations using same payIDClaim
                    throw errors.ErrorHelper.getPackageError(errors.PackageErrorCode.ExistingCruxIDFound, this._payIDClaim.virtualAddress);
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
        try {
            const {assetAddressMap, success, failures} = await this._getAssetAddressMapFromCurrencyAddressMap(newAddressMap);
            await (this._payIDClaim as PayIDClaim).decrypt();
            if (Object.keys(assetAddressMap).length !== 0) {
                await (this._nameService as nameService.NameService).putAddressMapping({secrets: (this._payIDClaim as PayIDClaim).identitySecrets}, assetAddressMap);
            }
            await (this._payIDClaim as PayIDClaim).encrypt();
            return {success, failures};
        } catch (err) {
            throw errors.CruxClientError.fromError(err);
        }
    }

    public getAddressMap = async (): Promise<IAddressMapping> => {
        try {
            const currencyAddressMap: IAddressMapping = {};
            if (this._payIDClaim && this._payIDClaim.virtualAddress && this._configService) {
                const userAssetIdToAddressMap = await (this._nameService as nameService.NameService).getAddressMapping(this._payIDClaim.virtualAddress);

                for (const assetId of Object.keys(userAssetIdToAddressMap)) {
                    currencyAddressMap[(await (this._configService.translateAssetIdToSymbol(assetId)))] = userAssetIdToAddressMap[assetId];
                }
                return currencyAddressMap;

            } else {
                return {};
            }
        } catch (err) {
            if (err.errorCode && err.errorCode === 2107) {
                const error =  errors.ErrorHelper.getPackageError(errors.PackageErrorCode.GetAddressMapFailed);
                throw errors.CruxClientError.fromError(error);
            }
            throw errors.CruxClientError.fromError(err);
        }
    }

    public getAssetMapping = (): blockstackConfigurationService.IResolvedClientAssetMap => {
        try {
            if (this._configService) {
                return this._configService.resolvedClientAssetMap as blockstackConfigurationService.IResolvedClientAssetMap;
            } else {
                throw errors.ErrorHelper.getPackageError(errors.PackageErrorCode.ClientNotInitialized);
            }
        } catch (err) {
            throw errors.CruxClientError.fromError(err);
        }
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
            const assetId = await (this._configService as blockstackConfigurationService.BlockstackConfigurationService).translateSymbolToAssetId(walletCurrencySymbol);
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
}

export {
    encryption,
    errors,
    storage,
    nameService,
};
