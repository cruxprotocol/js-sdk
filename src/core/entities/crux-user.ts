import { CruxId } from "src/packages/identity-utils";
import { BaseError } from "../../packages/error";
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
    status: string;
    statusDetail: string;
}

export enum SubdomainRegistrationStatus {
    NONE = "NONE",
    PENDING = "PENDING",
    DONE = "DONE",
    REJECT = "REJECT",
}

export class CruxUser {
    public cruxID: CruxId;
    public registrationStatus: ICruxUserRegistrationStatus;
    private addressMap: IAddressMapping;

    constructor(cruxID: CruxId, addressMap: IAddressMapping, registrationStatus: ICruxUserRegistrationStatus) {
        this.cruxID = cruxID;
        this.addressMap = addressMap;
        this.registrationStatus = registrationStatus;
    }
    public getAddressMap(): IAddressMapping {
        return this.addressMap;
    }
    public setAddressMap(addressMap: IAddressMapping) {
        try {
            CruxSpec.validations.validateAddressMap(addressMap);
        } catch (error) {
            throw new BaseError(error, `Address Map validation failed!`);
        }
        this.addressMap = addressMap;
    }
    public getAddressFromAsset(assetId: string): IAddress {
        return this.addressMap[assetId] || this.addressMap[assetId.toLowerCase()];
    }
}
