import { IAddress, IAddressMapping } from "../../core/entities/crux-user";
import { errors } from "../../packages";
import { IGlobalAssetList } from "../../packages/configuration-service";
import { getLogger } from "../../packages/logger";
const log = getLogger(__filename);

export interface IClientAssetMapping {
    [currencySymbol: string]: string;
}

export interface IGlobalAsset {
    assetId: string;
    symbol: string;
    name: string;
    assetType: string|null;
    decimals: number|null;
    assetIdentifierName: string|null;
    assetIdentifierValue: number|string|null;
    parentAssetId: string|null;
}

export interface IResolvedClientAssetMap {
    [currencySymbol: string]: IGlobalAsset;
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
        this._assetMapping = this.getLowerAssetMapping(assetMapping);
        this._reverseAssetMap = {};
        for (const walletCurrencySymbol of Object.keys(this._assetMapping)) {
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

    public assetIdAssetListToSymbolAssetMap(assetIdAssetList: IGlobalAssetList): IResolvedClientAssetMap {
        const symbolAssetMap: IResolvedClientAssetMap = {};
        assetIdAssetList.forEach((asset) => {
            symbolAssetMap[this.assetIdToSymbol(asset.assetId)] = asset;
        });
        return symbolAssetMap;
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
        const lowerCurrencyAddressMap: IAddressMapping = {};
        const assetAddressMap: IAddressMapping = {};
        const success: IPutAddressMapSuccess = {};
        const failures: IPutAddressMapFailures = {};
        for (let walletCurrencySymbol of Object.keys(currencyAddressMap)) {
            lowerCurrencyAddressMap[walletCurrencySymbol.toLowerCase()] = currencyAddressMap[walletCurrencySymbol];
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

    private getLowerAssetMapping(assetMapping: IClientAssetMapping): IClientAssetMapping {
        const lowerAssetMapping: IClientAssetMapping = {};
        for (const currencySymbol of Object.keys(assetMapping)) {
            lowerAssetMapping[currencySymbol.toLowerCase()] = assetMapping[currencySymbol];
        }
        return lowerAssetMapping;
    }
}
