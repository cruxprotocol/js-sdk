import { BaseError } from "../../packages/error";
import { CruxId } from "../../packages/identity-utils";
import { getLogger } from "../../packages/logger";
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
}

export interface ICruxUserConfiguration {
    enabledAssetGroups: string[];
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
    private cruxUserInformation!: ICruxUserInformation;
    private cruxUserID!: CruxId;
    private addressMap!: IAddressMapping;
    private cruxUserConfig!: ICruxUserConfiguration;
    private cruxDomain!: CruxDomain;

    constructor(cruxUserSubdomain: string, cruxDomain: CruxDomain, addressMap: IAddressMapping, cruxUserInformation: ICruxUserInformation, cruxUserData: ICruxUserData) {
        this.setCruxDomain(cruxDomain);
        this.setCruxUserID(cruxUserSubdomain);
        this.setAddressMap(addressMap);
        this.setCruxUserInformation(cruxUserInformation);
        this.setCruxUserConfig(cruxUserData.configuration);
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
    public setSupportedAssetGroups = (assetIdAssetGroups: string[]) => {
        // validate the assetIdAssetGroup is supported by the walletClient
        assetIdAssetGroups.forEach((assetGroup) => {
            if (!this.cruxDomain.config.supportedAssetGroups.includes(assetGroup)) {
                throw new BaseError(null, "assetGroup not supported by domain");
            }
        });
        const enabledAssetGroupsSet = new Set(assetIdAssetGroups);
        this.cruxUserConfig.enabledAssetGroups = [...enabledAssetGroupsSet];
    }
    public getAddressMap(): IAddressMapping {
        return this.addressMap;
    }
    public setAddressMap(addressMap: IAddressMapping) {
        // addressMap is not validated due to the presence of magic key: "__userData__";
        this.addressMap = addressMap;
    }
    public getAddressFromAsset(asset: IGlobalAsset): IAddress|undefined {
        const addressResolver = new CruxUserAddressResolver(this.addressMap, this.cruxDomain.config.assetList, this.cruxUserConfig);
        return addressResolver.resolveAddressWithAsset(asset);
    }
    public getAddressFromAssetMatcher(assetMatcher: IAssetMatcher): IAddress|undefined {
        const addressResolver = new CruxUserAddressResolver(this.addressMap, this.cruxDomain.config.assetList, this.cruxUserConfig);
        return addressResolver.resolveAddressWithAssetMatcher(assetMatcher);
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
            enabledAssetGroups: cruxUserConfiguration.enabledAssetGroups || [],
        };
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
