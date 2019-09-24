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

interface ICruxIDState {
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
    private _storage: storage.StorageService = new storage.LocalStorage();

    constructor(openPayObj: IOpenPayClaim = {} as IOpenPayClaim, options: openPayOptions) {
        if (!options.getEncryptionKey) { throw new Error((`Missing encryptionKey method!`)); }
        this._getEncryptionKey = options.getEncryptionKey;

        if (options.encryption) { this._encryption = options.encryption; }
        if (options.storage) { this._storage = options.storage; }

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

    public save = async (): Promise<void> => {
        const json = await this.toJSON();
        // log.debug(`PayIDClaim being stored to storage:`, json)
        this._storage.setJSON("payIDClaim", json);
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

    public registerCruxID = async (virtualAddress: string): Promise<void> => {
        this._setPayIDClaim(new PayIDClaim({virtualAddress}, { getEncryptionKey: this._getEncryptionKey }));
        // await this._payIDClaim.setPasscode(passcode)
        await (this._payIDClaim as PayIDClaim).encrypt();
        this._storage.setJSON("payIDClaim", (this._payIDClaim as PayIDClaim).toJSON());
        await this._restoreIdentity();
    }

    public updatePassword = async (oldEncryptionKey: string, newEncryptionKey: string): Promise<boolean> => {
        if (this._hasPayIDClaimStored()) {
            await (this._payIDClaim as PayIDClaim).decrypt(oldEncryptionKey);
            await (this._payIDClaim as PayIDClaim).encrypt(newEncryptionKey);
            this._storage.setJSON("payIDClaim", (this._payIDClaim as PayIDClaim).toJSON());
            return true;
        } else {
            return false;
        }
    }

    public isCruxIDAvailable = (cruxIDSubdomain: string): Promise<boolean> => {
        //Subdomain validation 
        identityUtils.CruxId.validateSubdomain(cruxIDSubdomain)
        return (this._nameservice as nameservice.NameService).getNameAvailability(cruxIDSubdomain);
    }

    public resolveCurrencyAddressForCruxID = async (fullCruxID: string, walletCurrencySymbol: string): Promise<IAddress> => {
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
            throw new Errors.ClientErrors.AssetIDNotAvailable("Asset ID doesn\'t exist in client mapping", 1200)
        }

        const addressMap = await (this._nameservice as nameservice.NameService).getAddressMapping(fullCruxID);
        log.debug(`Address map: `, addressMap);
        if (!addressMap[correspondingAssetId]) {
            console.groupEnd();
            throw new Errors.ClientErrors.AddressNotAvailable("Currency address not available for user", 1103);
        }
        const address: IAddress = addressMap[correspondingAssetId] || addressMap[correspondingAssetId.toLowerCase()];
        log.debug(`Address:`, address);
        console.groupEnd();
        return address;
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
                this._storage.setJSON("payIDClaim", (this._payIDClaim as PayIDClaim).toJSON());
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
export class CruxClient extends OpenPayPeer {
    // NameService specific methods
    public getCruxIDState = async (): Promise<ICruxIDState> => {

        // TODO: handle reject cases ?
        const fullCruxID = this.hasPayIDClaim() ? this.getPayIDClaim().virtualAddress : undefined;
        const status = await this.getIDStatus();
        return {
            cruxID: fullCruxID,
            status,
        };
    }

    public getIDStatus = async (): Promise<nameservice.CruxIDRegistrationStatus> => {
        await (this._payIDClaim as PayIDClaim).decrypt();
        const result = (this._nameservice as nameservice.NameService).getRegistrationStatus({secrets: (this._payIDClaim as PayIDClaim).identitySecrets});
        await (this._payIDClaim as PayIDClaim).encrypt();
        return result;
    }

    public registerCruxID = async (cruxIDSubdomain: string, newAddressMap?: IAddressMapping): Promise<void> => {
        // TODO: add isCruxIDAvailable check before
        
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
        this._storage.setJSON("payIDClaim", (this._payIDClaim as PayIDClaim).toJSON());

        // TODO: Setup public addresses
        if (newAddressMap) {
            log.debug(`Selected addresses for resolving via your ID: ${
                Object.keys(newAddressMap).map((currency) => {
                    return `\n${newAddressMap[currency].addressHash}`;
                })
            }`);
            await this.putAddressMap(newAddressMap);
        }

    }

    public putAddressMap = async (newAddressMap: IAddressMapping): Promise<boolean> => {
        const clientMapping: any = this._clientMapping;
        const csAddressMap: any = {};
        for (const key of Object.keys(newAddressMap)) {
            csAddressMap[clientMapping[key]] = newAddressMap[key];
        }

        await (this._payIDClaim as PayIDClaim).decrypt();
        const acknowledgement = await (this._nameservice as nameservice.NameService).putAddressMapping({secrets: (this._payIDClaim as PayIDClaim).identitySecrets}, csAddressMap);
        await (this._payIDClaim as PayIDClaim).encrypt();

        if (!acknowledgement) { throw new Error((`Could not update the addressMap`)); }
        return acknowledgement;
    }

    public getAddressMap = async (): Promise<IAddressMapping> => {
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
    }

}

export {
    Errors,
    encryption,
    storage,
    nameservice,
};
