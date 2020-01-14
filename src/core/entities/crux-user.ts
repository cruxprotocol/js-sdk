import { BaseError } from "../../packages/error";
import { CruxId } from "../../packages/identity-utils";
import { getLogger } from "../../packages/logger";
import { CruxSpec } from "./crux-spec";

const log = getLogger(__filename);

export interface IAddress {
    addressHash: string;
    secIdentifier?: string;
}

export interface IAddressMapping {
    [currency: string]: IAddress;
}

export interface ICruxUserRegistrationStatus {
    status: SubdomainRegistrationStatus;
    statusDetail: SubdomainRegistrationStatusDetail;
}

export enum SubdomainRegistrationStatus {
    NONE = "NONE",
    PENDING = "PENDING",
    DONE = "DONE",
    REJECT = "REJECT",
}

export enum SubdomainRegistrationStatusDetail {
    NONE = "Subdomain not registered with this registrar.",
    PENDING_REGISTRAR = "Subdomain registration pending on registrar.",
    PENDING_BLOCKCHAIN = "Subdomain registration pending on blockchain.",
    DONE = "Subdomain propagated.",
}

interface AddressStoreAssetPermissions {
}

interface AddressStoreSettings {
    assetPermissions?: AddressStoreAssetPermissions;
}

interface CruxUserSettings {
    addressStoreSettings?: AddressStoreSettings;
}

// IAddressMapping will give either this or IAddress
interface IEncryptedAddressPacket {
    encryptedString: string;
    permissionedKeys: string[];
}

class AddressStore {
    constructor(addressMap: IAddressMapping, addressStoreSettings: AddressStoreSettings) {
    }
    // tslint:disable-next-line:no-empty
    public get(assetId: string, resolverUser?: CruxUser) {
        // Try to get object corresponding to assetId or parentId according to user settings
        // if not, return null
        // if yes, see if it is IAddress.
        //      if yes return it
        //      if no, it is IEncryptedAddressPacket.
        //             if resolverUser null - raise error
        //             if exists, try to decrypt IEncryptedAddressPacket using cruxUser's public key
    }
}

export class CruxUser {
    public registrationStatus: ICruxUserRegistrationStatus;
    private cruxUserID: CruxId;
    private addressMap!: IAddressMapping;
    // private addressStore: AddressStore;

    constructor(cruxID: CruxId, addressMap: IAddressMapping, registrationStatus: ICruxUserRegistrationStatus, userSettings?: CruxUserSettings) {
        this.cruxUserID = cruxID;
        this.setAddressMap(addressMap);
        // @ts-ignore
        const addressStoreSettings: AddressStoreSettings = userSettings ? userSettings.addressStoreSettings : {};
        // this.addressStore = new AddressStore(addressMap, addressStoreSettings);
        this.registrationStatus = this.setRegistrationStatus(registrationStatus);
        log.info("CruxUser initialised");
    }
    get cruxID() {
        return this.cruxUserID;
    }
    public getAddressMap(): IAddressMapping {
        return this.addressMap;
    }
    public setAddressMap(addressMap: IAddressMapping) {
        // TODO PVTADDRESS #3: assetPermissions is another parameter. if an asset has a permission configured, its IAddress will not be stored. IEncryptedAddressPacket will be stored
        // IEncryptedAddressPacket will contain encryptedAddressSerialized and permissionedKeys
        // encryptedAddressSerialized = IAddress->serialize->encrypt with randomKey R
        // Encrypt R with public key of users in permission list
        // must give permission to own public key as well!

        try {
            CruxSpec.validations.validateAssetIdAddressMap(addressMap);
        } catch (error) {
            throw new BaseError(error, `Address Map validation failed!`);
        }
        this.addressMap = addressMap;
    }
    public getAddressFromAsset(assetId: string): IAddress {
        // TODO ERC20MODE #1: check userSettings for allowParentIdLookup: true. if yes, lookup parentId if assetId is not found
        // TODO PVTADDRESS #2: resolverUser is another parameter, check if address is encrypted. if yes, try decrypting using resolverUser's public key
        return this.addressMap[assetId];
    }
    private setRegistrationStatus = (registrationStatus: ICruxUserRegistrationStatus) => {
        // validate and set the registrationStatus
        if (!(Object.values(SubdomainRegistrationStatus).includes(registrationStatus.status))) {
            throw new BaseError(null, `Subdomain registration status validation failed!`);
        }
        if (!(Object.values(SubdomainRegistrationStatusDetail).includes(registrationStatus.statusDetail))) {
            throw new BaseError(null, `Subdomain registration status detail validation failed!`);
        }
        return registrationStatus;
    }
}
