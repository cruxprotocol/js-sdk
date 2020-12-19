import { Encryption } from "../../packages/encryption";
import { BaseError } from "../../packages/error";
import { CruxId } from "../../packages/identity-utils";
import { getLogger } from "../../packages/logger";
import { IKeyManager } from "../interfaces";
import { CruxDomain, IGlobalAsset, IGlobalAssetList } from "./crux-domain";

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

export interface ICruxUserInformation {
    registrationStatus: ICruxUserRegistrationStatus;
    transactionHash?: string;
    ownerAddress?: string;
}

export interface ICruxUserData {
    configuration: ICruxUserConfiguration;
    privateAddresses: ICruxUserPrivateAddresses;
    privateInformation: string;
}

export interface ICruxUserConfiguration {
    enabledAssetGroups: string[];
    // blacklistedCruxUsers: string[];
}

export interface ICruxDecryptedPrivateInformation {
    blacklistedCruxUsers: string[];
}

export interface ICruxUserPrivateAddresses {
    [sharedSecretHash: string]: string;
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

export class CruxUser {
    private pubKey?: string;
    private cruxUserInformation!: ICruxUserInformation;
    private cruxUserID!: CruxId;
    private addressMap!: IAddressMapping;
    private cruxUserConfig!: ICruxUserConfiguration;
    private cruxUserPrivateAddresses!: ICruxUserPrivateAddresses;
    private cruxDomain!: CruxDomain;
    private cruxPrivateInformation!: string;

    constructor(cruxUserSubdomain: string, cruxDomain: CruxDomain, addressMap: IAddressMapping, cruxUserInformation: ICruxUserInformation, cruxUserData: ICruxUserData, publicKey?: string) {
        this.setCruxDomain(cruxDomain);
        this.setCruxUserID(cruxUserSubdomain);
        this.setAddressMap(addressMap);
        this.setCruxUserInformation(cruxUserInformation);
        this.setCruxUserConfig(cruxUserData.configuration);
        this.setPublicKey(publicKey);
        this.setCruxUserPrivateAddresses(cruxUserData.privateAddresses);
        this.setCruxUserPrivateInformation(cruxUserData.privateInformation);
        log.debug("CruxUser initialised");
    }
    get cruxID() {
        return this.cruxUserID;
    }
    get domain() {
        return this.cruxDomain;
    }
    get info() {
        return this.cruxUserInformation;
    }
    get config() {
        return this.cruxUserConfig;
    }
    get publicKey() {
        return this.pubKey;
    }
    get privateAddresses() {
        return this.cruxUserPrivateAddresses;
    }
    get privateInformation() {
        return this.cruxPrivateInformation;
    }
    public setSupportedAssetGroups = () => {
        this.cruxUserConfig.enabledAssetGroups = this.cruxDomain.config.supportedAssetGroups;
    }
    public getAddressMap(): IAddressMapping {
        return this.addressMap;
    }
    public setAddressMap(addressMap: IAddressMapping) {
        // addressMap is not validated due to the presence of magic key: "__userData__";
        this.addressMap = addressMap;
    }
    public setPrivateAddressMap = async (cruxUser: CruxUser, addressMap: IAddressMapping, keyManager: IKeyManager): Promise<void> => {
        if (keyManager && "deriveSharedSecret" in keyManager && typeof keyManager.deriveSharedSecret === "function") {
            const sharedSecret = await keyManager.deriveSharedSecret(cruxUser.publicKey!);
            const sharedSecretHash = Encryption.hash(sharedSecret);
            const encryptedAddressMapObject = await Encryption.encryptJSON(addressMap, sharedSecret);
            this.cruxUserPrivateAddresses[sharedSecretHash] = JSON.stringify(encryptedAddressMapObject);
        } else {
            throw new BaseError(null, "Not supported by the keyManager in use");
        }
    }
    public setPrivateInformation = async (decryptedPrivateInfo: ICruxDecryptedPrivateInformation, keyManager: IKeyManager) => {
        const encryptedPrivateInfo: string = await keyManager.symmetricEncrypt!(decryptedPrivateInfo);
        this.cruxPrivateInformation = encryptedPrivateInfo;
    }
    public getAddressFromAsset = async (asset: IGlobalAsset, keyManager?: IKeyManager): Promise<IAddress|undefined> => {
        let address: IAddress|undefined;
        if (keyManager) {
            const decryptedAddressMap = await this.getDecryptedAddressMap(keyManager);
            const addressResolver = new CruxUserAddressResolver(decryptedAddressMap, this.cruxDomain.config.assetList, this.cruxUserConfig);
            address = addressResolver.resolveAddressWithAsset(asset);
        }
        if (!address) {
            const addressResolver = new CruxUserAddressResolver(this.addressMap, this.cruxDomain.config.assetList, this.cruxUserConfig);
            address = addressResolver.resolveAddressWithAsset(asset);
        }
        return address;
    }
    public getAddressFromAssetMatcher = async (assetMatcher: IAssetMatcher, keyManager?: IKeyManager): Promise<IAddress|undefined> => {
        let address: IAddress|undefined;
        if (keyManager) {
            const decryptedAddressMap = await this.getDecryptedAddressMap(keyManager);
            const addressResolver = new CruxUserAddressResolver(decryptedAddressMap, this.cruxDomain.config.assetList, this.cruxUserConfig);
            address = addressResolver.resolveAddressWithAssetMatcher(assetMatcher);
        }
        if (!address) {
            const addressResolver = new CruxUserAddressResolver(this.addressMap, this.cruxDomain.config.assetList, this.cruxUserConfig);
            address = addressResolver.resolveAddressWithAssetMatcher(assetMatcher);
        }
        return address;
    }
    private getDecryptedAddressMap = async (keyManager: IKeyManager) => {
        if (this.pubKey && "deriveSharedSecret" in keyManager && typeof keyManager.deriveSharedSecret === "function") {
            const sharedSecret = await keyManager.deriveSharedSecret(this.pubKey);
            const sharedSecretHash = Encryption.hash(sharedSecret);
            const encryptedAddressMapObject: {encBuffer: string, iv: string} = this.cruxUserPrivateAddresses[sharedSecretHash] && JSON.parse(this.cruxUserPrivateAddresses[sharedSecretHash]);
            if (encryptedAddressMapObject) {
                const decryptedAddressMap = await Encryption.decryptJSON(encryptedAddressMapObject.encBuffer, encryptedAddressMapObject.iv, sharedSecret) as IAddressMapping;
                return decryptedAddressMap;
            }
        }
        return {};
    }
    private setCruxDomain = (cruxDomain: CruxDomain) => {
        if (!(cruxDomain instanceof CruxDomain)) {
            throw new BaseError(null, "Invalid cruxDomain provided in CruxUser");
        }
        this.cruxDomain = cruxDomain;
    }
    private setCruxUserID = (cruxUserSubdomain: string) => {
        this.cruxUserID = new CruxId({
            domain: this.cruxDomain.id.components.domain,
            subdomain: cruxUserSubdomain,
        });
    }
    private setCruxUserInformation = (cruxUserInformation: ICruxUserInformation) => {
        // validate and set the cruxUserInformation
        if (!(Object.values(SubdomainRegistrationStatus).includes(cruxUserInformation.registrationStatus.status))) {
            throw new BaseError(null, `Subdomain registration status validation failed!`);
        }
        if (!(Object.values(SubdomainRegistrationStatusDetail).includes(cruxUserInformation.registrationStatus.statusDetail))) {
            throw new BaseError(null, `Subdomain registration status detail validation failed!`);
        }
        this.cruxUserInformation = cruxUserInformation;
    }
    private setCruxUserConfig = (cruxUserConfiguration: ICruxUserConfiguration) => {
        // TODO: validation of the configurations
        this.cruxUserConfig = {
            // blacklistedCruxUsers: cruxUserConfiguration.blacklistedCruxUsers,
            enabledAssetGroups: cruxUserConfiguration.enabledAssetGroups || [],
        };
    }
    private setPublicKey = (publicKey?: string) => {
        // TODO: validation of the publicKey;
        this.pubKey = publicKey;
    }
    private setCruxUserPrivateAddresses = (cruxUserPrivateAddresses: ICruxUserPrivateAddresses) => {
        // TODO: validation of the private addresses
        if (!cruxUserPrivateAddresses) {
            this.cruxUserPrivateAddresses = {};
        } else {
            this.cruxUserPrivateAddresses = cruxUserPrivateAddresses;
        }
    }
    private setCruxUserPrivateInformation = async (privateInfo: string) => {
        this.cruxPrivateInformation = privateInfo;
    }
}

export interface IAssetMatcher {
    assetGroup: string;
    assetIdentifierValue?: string|number;
}

export class CruxUserAddressResolver {
    private userAddressMap: IAddressMapping;
    private userClientAssetList: IGlobalAssetList;
    private userConfig: ICruxUserConfiguration;
    constructor(cruxUserAddressMap: IAddressMapping, cruxUserClientAssetList: IGlobalAssetList, cruxUserConfig: ICruxUserConfiguration) {
        this.userAddressMap = cruxUserAddressMap;
        this.userClientAssetList = cruxUserClientAssetList;
        this.userConfig = cruxUserConfig;
    }
    public resolveAddressWithAsset = (asset: IGlobalAsset): IAddress|undefined => {
        let address: IAddress|undefined;
        // check for the address using the assetId
        address = this.userAddressMap[asset.assetId];
        // if address not found, check the parentAssetFallback config
        if (!address) {
            const assetGroup = this.assetToAssetGroup(asset);
            address = assetGroup ? this.resolveFallbackAddressIfEnabled(assetGroup) : undefined;
        }
        return address;
    }
    public resolveAddressWithAssetMatcher = (assetMatcher: IAssetMatcher): IAddress|undefined => {
        let address: IAddress|undefined;
        // if assetIdentifier is provided, find the asset matching the identifier
        if (assetMatcher.assetIdentifierValue) {
            const asset = this.findAssetWithAssetMatcher(assetMatcher);
            // if asset is available, resolve the address with asset found
            if (asset) {
                address = this.resolveAddressWithAsset(asset);
            } else {
                address = this.resolveFallbackAddressIfEnabled(assetMatcher.assetGroup);
            }
        } else {
            address = this.resolveFallbackAddressIfEnabled(assetMatcher.assetGroup);
        }
        return address;
    }
    private findAssetWithAssetMatcher = (assetMatcher: IAssetMatcher): IGlobalAsset|undefined => {
        const asset = this.userClientAssetList.find((a) => {
            let match = false;
            let assetIdentifierValueMatch = false;
            // matching the assetIdentifierValue
            if (typeof a.assetIdentifierValue === "string" && typeof assetMatcher.assetIdentifierValue === "string" && a.assetIdentifierValue.toLowerCase() === assetMatcher.assetIdentifierValue.toLowerCase()) {
                assetIdentifierValueMatch = true;
            } else if (typeof a.assetIdentifierValue === "number" && typeof assetMatcher.assetIdentifierValue === "number" && a.assetIdentifierValue === assetMatcher.assetIdentifierValue) {
                assetIdentifierValueMatch = true;
            }
            // matching the assetGroup
            if (assetIdentifierValueMatch) {
                const assetGroup = this.assetToAssetGroup(a);
                match = Boolean(assetGroup && (assetGroup === assetMatcher.assetGroup));
            }
            return match;
        });
        return asset;
    }
    private resolveFallbackAddressIfEnabled = (assetGroup: string): IAddress|undefined => {
        let address: IAddress|undefined;
        const isFallbackEnabled = this.userConfig.enabledAssetGroups.includes(assetGroup);
        // if fallback enabled, find the parentAsset's address
        if (isFallbackEnabled) {
            const parentAssetId = assetGroup.split("_")[1];
            address = this.userAddressMap[parentAssetId];
        }
        return address;
    }
    private assetToAssetGroup = (asset: IGlobalAsset): string|undefined => {
        if (!asset.assetType || !asset.parentAssetId) {
            return;
        }
        return `${asset.assetType}_${asset.parentAssetId}`;
    }
}
