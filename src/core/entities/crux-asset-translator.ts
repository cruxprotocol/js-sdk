import { errors } from "../../packages";
import { getLogger } from "../../packages/logger";
import { IAddress, IAddressMapping } from "./crux-user";
const log = getLogger(__filename);
// export class CruxAssetTranslator {
//     private _assetMapping: IClientAssetMapping;
//     private _assetList: IGlobalAssetList;
//     constructor(assetMapping: IClientAssetMapping, assetList: IGlobalAssetList) {
//         this._assetMapping = assetMapping;
//         this._assetList = assetList;
//         log.info("CruxAssetTranslator initialised");
//     }
//     get assetMapping() {
//         return this._assetMapping;
//     }
//     set assetMapping(assetMapping: IClientAssetMapping) {
//         this._assetMapping = assetMapping;
//     }
//     get assetList() {
//         return this._assetList;
//     }
//     set assetList(assetList: IGlobalAssetList) {
//         this._assetList = assetList;
//     }
// }

export interface IClientAssetMapping {
    [currencySymbol: string]: string;
}

export interface IReverseClientAssetMapping {
    [assetId: string]: string;
}

export interface IPutAddressMapSuccess {
    [currency: string]: IAddress;
}

export interface IPutAddressMapFailures {
    [currency: string]: string;
}

export class CruxAssetTranslator {
    private _assetMapping: IClientAssetMapping;
    private _reverseAssetMap: IReverseClientAssetMapping;
    constructor(assetMapping: IClientAssetMapping) {
        this._assetMapping = assetMapping;
        this._reverseAssetMap = {};
        for (let walletCurrencySymbol of Object.keys(this._assetMapping)) {
            walletCurrencySymbol = walletCurrencySymbol.toLowerCase();
            this._reverseAssetMap[this._assetMapping[walletCurrencySymbol]] = walletCurrencySymbol;
        }
    }
    get assetMapping() {
        return this._assetMapping;
    }
    set assetMapping(assetMapping: IClientAssetMapping) {
        this._assetMapping = assetMapping;
    }
    public symbolToAssetId(currencySymbol: string): string {
        currencySymbol = currencySymbol.toLowerCase();
        return this._assetMapping[currencySymbol];
    }
    public assetIdToSymbol(assetId: string): string {
        return this._reverseAssetMap[assetId];
    }

    // TODO: What should we be returning when calling below two methods?

    public assetIdAddressMapToSymbolAddressMap(userAssetIdToAddressMap: IAddressMapping): IAddressMapping {
        const currencyAddressMap: IAddressMapping = {};
        for (const assetId of Object.keys(userAssetIdToAddressMap)) {
            currencyAddressMap[this.assetIdToSymbol(assetId)] = userAssetIdToAddressMap[assetId];
        }
        return currencyAddressMap;
    }
    public symbolAddressMapToAssetIdAddressMap(currencyAddressMap: IAddressMapping): {success: IPutAddressMapSuccess, failures: IPutAddressMapFailures, assetAddressMap: IAddressMapping} {
        const lowerCurrencyAddressMap = Object.assign({}, currencyAddressMap);
        const assetAddressMap: IAddressMapping = {};
        const success: IPutAddressMapSuccess = {};
        const failures: IPutAddressMapFailures = {};
        for (let walletCurrencySymbol of Object.keys(lowerCurrencyAddressMap)) {
            lowerCurrencyAddressMap[walletCurrencySymbol.toLowerCase()] = lowerCurrencyAddressMap[walletCurrencySymbol];
            walletCurrencySymbol = walletCurrencySymbol.toLowerCase();
            const assetId = this.symbolToAssetId(walletCurrencySymbol);
            if (assetId) {
                assetAddressMap[assetId] = lowerCurrencyAddressMap[walletCurrencySymbol];
                success[walletCurrencySymbol] = lowerCurrencyAddressMap[walletCurrencySymbol];
            } else {
                failures[walletCurrencySymbol] = `${errors.PackageErrorCode.CurrencyDoesNotExistInClientMapping}: ${errors.ERROR_STRINGS[errors.PackageErrorCode.CurrencyDoesNotExistInClientMapping]}`;
            }
        }
        return {
            assetAddressMap,
            failures,
            success,
        };
    }
}
