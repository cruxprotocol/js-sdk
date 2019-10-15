import {EventEmitter} from "eventemitter3";
import Logger from "js-logger";
import path from "path";
import "regenerator-runtime/runtime";
import config from "./config";

// Setup logging configuration
Logger.useDefaults();
Logger.setLevel(config.CONFIG_MODE === "prod" ? Logger.INFO : Logger.DEBUG);
export function getLogger(filename: string) {
    return Logger.get("CruxPay: " + filename.slice(filename.lastIndexOf(path.sep) + 1, filename.length - 3));
}
const log = getLogger(__filename);

// Importing packages
import {
    BlockstackConfigurationService,
    blockstackService,
    encryption,
    errors,
    identityUtils,
    nameService,
    storage,
} from "./packages";

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

interface ICruxPayPeerOptions {
    getEncryptionKey: () => string;
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
    identitySecrets?: string | nameService.IIdentityClaim;
}

export interface ICruxIDState {
    cruxID?: string;
    status: nameService.CruxIDRegistrationStatus;
}

interface payIDClaimOptions {
    getEncryptionKey: () => string;
    encryption?: typeof encryption.Encryption;
}

export class PayIDClaim implements ICruxPayClaim {

    public virtualAddress: string | undefined;
    public identitySecrets: string | nameService.IIdentityClaim | undefined;
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
            this.identitySecrets = (await this._encryption.decryptJSON(encryptedObj.encBuffer, encryptedObj.iv, encryptionKeyDigest) as nameService.IIdentityClaim);
        }
    }

    public toJSON = (): ICruxPayClaim => {
        // await this.encrypt()
        const json = JSON.parse(JSON.stringify({
            identitySecrets: this.identitySecrets,
            virtualAddress: this.virtualAddress,
        }));
        return json;
    }

    public save = async (storageService: storage.StorageService): Promise<void> => {
        const json = this.toJSON();
        // log.debug(`PayIDClaim being stored to storage:`, json)
        storageService.setJSON("payIDClaim", json);
    }

    private _isEncrypted = (): boolean => {
        return typeof this.identitySecrets !== "object";
    }

}

class CruxPayPeer extends EventEmitter {
    public walletClientName: string;
    protected _options: ICruxPayPeerOptions;
    protected _getEncryptionKey: () => string;

    protected _storage: storage.StorageService;
    protected _encryption: typeof encryption.Encryption;
    protected _nameService: nameService.NameService | undefined;
    protected _assetList: object | undefined;
    protected _clientMapping: object | undefined;
    protected _payIDClaim: PayIDClaim | undefined;

    constructor(_options: ICruxPayPeerOptions) {
        super();

        this._options = Object.assign({}, _options);
        // TODO: Need to validate options

        this._getEncryptionKey = _options.getEncryptionKey;
        // log.debug(`Encryption key:`, this._getEncryptionKey())

        // Setting up the default modules as fallbacks
        this._storage =  this._options.storage || new storage.LocalStorage();
        this._encryption = this._options.encryption || encryption.Encryption;
        this._nameService = this._options.nameService;
        this.walletClientName = this._options.walletClientName;

        log.info(`Config mode:`, config.CONFIG_MODE);
        log.info(`CruxPayPeer Initialised`);
    }

    public async init() {
        let configService;

        if (this._hasPayIDClaimStored()) {
            const payIDClaim = this._storage.getJSON("payIDClaim");
            // log.debug(`Local payIDClaim:`, payIDClaim)
            const options = {
                bnsNodes: undefined,
                domain: this.walletClientName + "_crux",
                gaiaHub: undefined,
                subdomainRegistrar: undefined,
            };
            this._setPayIDClaim(new PayIDClaim(payIDClaim as ICruxPayClaim, { getEncryptionKey: this._getEncryptionKey }));
            const ns: blockstackService.BlockstackService = new blockstackService.BlockstackService(options);
            await (this._payIDClaim as PayIDClaim).decrypt();
            await ns.restoreIdentity((this._payIDClaim as PayIDClaim).virtualAddress as string, {secrets: (this._payIDClaim as PayIDClaim).identitySecrets});
            const status = await ns.getRegistrationStatus({secrets: (this._payIDClaim as PayIDClaim).identitySecrets});
            await (this._payIDClaim as PayIDClaim).encrypt();
            if (status.status === blockstackService.SubdomainRegistrationStatus.DONE) {
                configService = new BlockstackConfigurationService(this.walletClientName, (this._payIDClaim as PayIDClaim).virtualAddress);
            } else {
                configService = new BlockstackConfigurationService(this.walletClientName);
            }
            await this._initializeNameService(configService);
            await this._restoreIdentity();
        } else {
            configService = new BlockstackConfigurationService(this.walletClientName);
            await this._initializeNameService(configService);
            const identityClaim = await (this._nameService as nameService.NameService).generateIdentity();
            const payIDClaim = {identitySecrets: identityClaim.secrets};
            this._setPayIDClaim(new PayIDClaim(payIDClaim as ICruxPayClaim, { getEncryptionKey: this._getEncryptionKey }));
            log.debug(`Allocated temporary identitySecrets and payIDClaim`);
        }
        this._clientMapping = await configService.getClientAssetMapping();
        this._assetList = await configService.getGlobalAssetList();

        log.debug(`global asset list is:- `, this._assetList);
        log.debug(`client asset mapping is:- `, this._clientMapping);
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
            let correspondingAssetId: string = "";
            for (const i in this._clientMapping) {
                if (i === walletCurrencySymbol) {
                    // @ts-ignore
                    correspondingAssetId = this._clientMapping[i];
                }
            }
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

    private _initializeNameService = async (configService: BlockstackConfigurationService) => {
        await configService.init();
        if (!this._nameService) {
            this._nameService = await configService.getBlockstackServiceForConfig();
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
    // NameService specific methods
    public getCruxIDState = async (): Promise<ICruxIDState> => {
        try {
            const fullCruxID = this.hasPayIDClaim() ? this.getPayIDClaim().virtualAddress : undefined;
            const status = await this.getIDStatus();
            return {
                cruxID: fullCruxID,
                status,
            };
        } catch (err) {
            throw errors.CruxClientError.fromError(err);
        }
    }

    public registerCruxID = async (cruxIDSubdomain: string, newAddressMap?: IAddressMapping): Promise<void> => {
        // TODO: add isCruxIDAvailable check before
        try {
            // Subdomain validation
            identityUtils.validateSubdomain(cruxIDSubdomain);

            // Generating the identityClaim
            await (this._payIDClaim as PayIDClaim).decrypt();
            const identityClaim = this._payIDClaim ? {secrets: this._payIDClaim.identitySecrets} : await (this._nameService as nameService.NameService).generateIdentity();
            const registeredPublicID = await (this._nameService as nameService.NameService).registerName(identityClaim, cruxIDSubdomain);

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
        } catch (err) {
            throw errors.CruxClientError.fromError(err);
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
            const acknowledgement = await (this._nameService as nameService.NameService).putAddressMapping({secrets: (this._payIDClaim as PayIDClaim).identitySecrets}, csAddressMap);
            await (this._payIDClaim as PayIDClaim).encrypt();
            return acknowledgement;
        } catch (err) {
            throw errors.CruxClientError.fromError(err);
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
                const assetIdMap = await (this._nameService as nameService.NameService).getAddressMapping(this._payIDClaim.virtualAddress);

                for (const key of Object.keys(assetIdMap)) {
                    clientIdMap[clientIdToAssetIdMap[key]] = assetIdMap[key];
                }
                return clientIdMap;

            } else {
                return {};
            }
        } catch (err) {
            throw errors.CruxClientError.fromError(err);
        }
    }

    private getIDStatus = async (): Promise<nameService.CruxIDRegistrationStatus> => {
        await (this._payIDClaim as PayIDClaim).decrypt();
        const result = await (this._nameService as nameService.NameService).getRegistrationStatus({secrets: (this._payIDClaim as PayIDClaim).identitySecrets});
        await (this._payIDClaim as PayIDClaim).encrypt();
        return result;
    }

}

export {
    encryption,
    errors,
    storage,
    nameService,
};
