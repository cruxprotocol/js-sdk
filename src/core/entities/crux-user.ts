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

export class CruxUser {
    public cruxID: CruxId;
    private _addressMap: IAddressMapping;

    constructor(cruxID: CruxId, addressMap: IAddressMapping) {
        this.cruxID = cruxID;
        this._addressMap = addressMap;
    }

    get addressMap() {
        return this._addressMap;
    }
    set addressmap(addressMap: IAddressMapping) {
        this._addressMap = addressMap;
    }
    public getAddress(assetId: string): IAddress|undefined {
        return this._addressMap[assetId];
    }
}
