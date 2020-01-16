import { Validations } from "../../core/entities/crux-spec";
import { IAddress, IAddressMapping } from "../../core/entities/crux-user";
import { ERROR_STRINGS, PackageErrorCode } from "../../packages/error";
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

export interface IGlobalAssetList extends Array<IGlobalAsset> {}

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
    private assetMap: IClientAssetMapping;
    private reverseAssetMap: IReverseClientAssetMapping;
    constructor(assetMapping: IClientAssetMapping) {
        Validations.validateAssetMapping(assetMapping);
        this.assetMap = this.getLowerAssetMapping(assetMapping);
        this.reverseAssetMap = {};
        for (const walletCurrencySymbol of Object.keys(this.assetMap)) {
            this.reverseAssetMap[this.assetMap[walletCurrencySymbol]] = walletCurrencySymbol;
        }
    }
    get assetMapping() {
        return this.assetMap;
    }
    public symbolToAssetId(currencySymbol: string): string {
        currencySymbol = currencySymbol.toLowerCase();
        return this.assetMap[currencySymbol];
    }
    public assetIdToSymbol(assetId: string): string {
        return this.reverseAssetMap[assetId];
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
                failures[walletCurrencySymbol] = `${PackageErrorCode.CurrencyDoesNotExistInClientMapping}: ${ERROR_STRINGS[PackageErrorCode.CurrencyDoesNotExistInClientMapping]}`;
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
