import { CruxId } from "src/packages/identity-utils";
import { getLogger } from "../../packages/logger";

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

export class CruxUser {
    public cruxID: CruxId;
    public registrationStatus: ICruxUserRegistrationStatus;
    private _addressMap: IAddressMapping;

    constructor(cruxID: CruxId, addressMap: IAddressMapping, registrationStatus: ICruxUserRegistrationStatus) {
        this.cruxID = cruxID;
        this._addressMap = addressMap;
        this.registrationStatus = registrationStatus;
    }
    get addressMap() {
        return this._addressMap;
    }
    set addressMap(addressMap: IAddressMapping) {
        this._addressMap = addressMap;
    }
    public getAddress(assetId: string): IAddress {
        return this._addressMap[assetId] || this._addressMap[assetId.toLowerCase()];
    }
}
