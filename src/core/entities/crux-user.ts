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
    transactionHash: string | "NONE";
    ownerAddress: string | "NONE";
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
    public cruxUserInformation: ICruxUserInformation;
    private cruxUserID: CruxId;
    private addressMap!: IAddressMapping;

    constructor(cruxID: CruxId, addressMap: IAddressMapping, cruxUserInformation: ICruxUserInformation) {
        this.cruxUserID = cruxID;
        this.setAddressMap(addressMap);
        this.cruxUserInformation = this.setCruxUserInformation(cruxUserInformation);
    }
    get cruxID() {
        return this.cruxUserID;
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
    public getAddressFromAsset(assetId: string): IAddress {
        return this.addressMap[assetId];
    }
    private setCruxUserInformation = (cruxUserInformation: ICruxUserInformation) => {
        // validate and set the cruxUserInformation
        if (!(Object.values(SubdomainRegistrationStatus).includes(cruxUserInformation.registrationStatus.status))) {
            throw new BaseError(null, `Subdomain registration status validation failed!`);
        }
        if (!(Object.values(SubdomainRegistrationStatusDetail).includes(cruxUserInformation.registrationStatus.statusDetail))) {
            throw new BaseError(null, `Subdomain registration status detail validation failed!`);
        }
        return cruxUserInformation;
    }
}
