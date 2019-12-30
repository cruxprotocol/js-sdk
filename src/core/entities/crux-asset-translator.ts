import { IClientAssetMapping, IGlobalAssetList } from "../../packages/configuration-service";
import { getLogger } from "../../packages/logger";
const log = getLogger(__filename);
export class CruxAssetTranslator {
    private _assetMapping: IClientAssetMapping;
    private _assetList: IGlobalAssetList;
    constructor(assetMapping: IClientAssetMapping, assetList: IGlobalAssetList) {
        this._assetMapping = assetMapping;
        this._assetList = assetList;
        log.info("CruxAssetTranslator initialised");
    }
    get assetMapping() {
        return this._assetMapping;
    }
    set assetMapping(assetMapping: IClientAssetMapping) {
        this._assetMapping = assetMapping;
    }
    get assetList() {
        return this._assetList;
    }
    set assetList(assetList: IGlobalAssetList) {
        this._assetList = assetList;
    }
}

export class CruxAssetTranslator2 {
    private _assetMapping: IClientAssetMapping;
    constructor(assetMapping: IClientAssetMapping) {
        this._assetMapping = assetMapping;
    }
    get assetMapping() {
        return this._assetMapping;
    }
    set assetMapping(assetMapping: IClientAssetMapping) {
        this._assetMapping = assetMapping;
    }
    public symbolToAssetId(currencySymbol: string): string {
        return this._assetMapping[currencySymbol];
    }
    public assetIdToSymbol(assetId: string): string {
        // TODO
        return "";
    }
}
