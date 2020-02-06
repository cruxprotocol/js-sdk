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

export interface ICruxUserInformation {
    registrationStatus: ICruxUserRegistrationStatus;
    transactionHash?: string;
    ownerAddress?: string;
}

export interface ICruxUserConfiguration {
    enabledParentAssetFallbacks: string[];
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

    constructor(cruxID: CruxId, addressMap: IAddressMapping, cruxUserInformation: ICruxUserInformation, cruxUserConfig: ICruxUserConfiguration) {
        this.setCruxUserID(cruxID);
        this.setAddressMap(addressMap);
        this.setCruxUserInformation(cruxUserInformation);
        this.setCruxUserConfig(cruxUserConfig);
        log.debug("CruxUser initialised");
    }
    get cruxID() {
        return this.cruxUserID;
    }
    get info() {
        return this.cruxUserInformation;
    }
    get config() {
        return this.cruxUserConfig;
    }
    public setParentAssetFallbacks = (assetGroups: string[]) => {
        // TODO: validate the assetGroups provided;
        const enabledFallbacksSet = new Set(assetGroups);
        this.cruxUserConfig.enabledParentAssetFallbacks = [...enabledFallbacksSet];
    }
    public getAddressMap(): IAddressMapping {
        return this.addressMap;
    }
    public setAddressMap(addressMap: IAddressMapping) {
        try {
            CruxSpec.validations.validateAssetIdAddressMap(addressMap);
        } catch (error) {
            throw new BaseError(error, `Address Map validation failed!`);
        }
        this.addressMap = addressMap;
    }
    public getAddressWithAssetId(assetId: string): IAddress|undefined {
        return this.addressMap[assetId];
    }
    private setCruxUserID = (cruxID: CruxId) => {
        if (cruxID instanceof CruxId) {
            this.cruxUserID = cruxID;
        } else {
            throw new BaseError(null, "Invalid CruxID");
        }
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
        this.cruxUserConfig = cruxUserConfiguration;
    }
}
