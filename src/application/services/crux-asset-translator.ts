import { IClientAssetMapping, IGlobalAsset, IGlobalAssetList } from "../../core/entities/crux-domain";
import { CruxSpec } from "../../core/entities/crux-spec";
import { IAddress, IAddressMapping } from "../../core/entities/crux-user";
import { ERROR_STRINGS, PackageErrorCode } from "../../packages/error";
import { getLogger } from "../../packages/logger";
const log = getLogger(__filename);

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

export interface IPutPrivateAddressMapFailures {
    [fullCruxID: string]: IGenericFailures;
}

export interface IPutPrivateAddressMapSuccess {
    [fullCruxID: string]: {
        success: IPutAddressMapSuccess,
        failures: IPutAddressMapFailures,
    };
}

export interface IGenericFailures {
    errorCode: number;
    errorMessage: string;
}

export class CruxAssetTranslator {
    private assetList!: IGlobalAssetList;
    private assetMap!: IClientAssetMapping;
    private reverseAssetMap!: IReverseClientAssetMapping;
    constructor(assetMapping: IClientAssetMapping, assetList: IGlobalAssetList) {
        this.setAssetList(assetList);
        this.setAssetMap(assetMapping);
        this.setReverseAssetMap(assetMapping);
        log.debug("CruxAssetTranslator initialised");
    }
    get assetMapping() {
        return this.assetMap;
    }
    public symbolToAssetId(currencySymbol: string): string|undefined {
        currencySymbol = currencySymbol.toLowerCase();
        return this.assetMap[currencySymbol];
    }
    public symbolAssetGroupToAssetIdAssetGroup = (symbolAssetGroup: string) => {
        return symbolAssetGroup.replace(new RegExp("(.+)_(.+)"), (match: string, assetType: string, assetSymbol: string) => `${assetType}_${this.symbolToAssetId(assetSymbol)}`);
    }
    public assetIdAssetGroupToSymbolAssetGroup = (assetIdAssetGroup: string) => {
        return assetIdAssetGroup.replace(new RegExp("(.+)_(.+)"), (match: string, assetType: string, assetId: string) => `${assetType}_${this.assetIdToSymbol(assetId)}`);
    }
    public symbolToAsset(currencySymbol: string): IGlobalAsset|undefined {
        return this.assetList.find((asset) => asset.assetId === this.symbolToAssetId(currencySymbol));
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
    private setAssetMap = (assetMapping: IClientAssetMapping): void => {
        CruxSpec.validations.validateAssetMapping(assetMapping, this.assetList);
        this.assetMap = this.getLowerAssetMapping(assetMapping);
    }
    private setReverseAssetMap = (assetMapping: IClientAssetMapping): void => {
        this.reverseAssetMap = {};
        for (const walletCurrencySymbol of Object.keys(this.assetMap)) {
            this.reverseAssetMap[this.assetMap[walletCurrencySymbol]] = walletCurrencySymbol;
        }
    }
    private setAssetList = (assetList: IGlobalAssetList): void => {
        CruxSpec.validations.validateAssetList(assetList);
        this.assetList = assetList;
    }
    private getLowerAssetMapping(assetMapping: IClientAssetMapping): IClientAssetMapping {
        const lowerAssetMapping: IClientAssetMapping = {};
        for (const currencySymbol of Object.keys(assetMapping)) {
            lowerAssetMapping[currencySymbol.toLowerCase()] = assetMapping[currencySymbol];
        }
        return lowerAssetMapping;
    }
}
