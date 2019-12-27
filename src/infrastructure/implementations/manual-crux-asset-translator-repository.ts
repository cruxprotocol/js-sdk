import { CruxAssetTranslator } from "../../core/entities/crux-asset-translator";
import { CruxSpec } from "../../core/entities/crux-spec";
import { ICruxAssetTranslatorRepository, ICruxAssetTranslatorRepositoryOptions } from "../../core/interfaces/crux-asset-translator-repository";
import { IKeyManager } from "../../core/interfaces/key-manager";
import { IClientAssetMapping } from "../../packages/configuration-service";
import { ErrorHelper, PackageErrorCode } from "../../packages/error";
import { getLogger } from "../../packages/logger";
const log = getLogger(__filename);
export interface IManualCruxAssetTranslatorRepositoryOptions extends ICruxAssetTranslatorRepositoryOptions {
    assetMapping?: IClientAssetMapping;
}
export class ManualCruxAssetTranslatorRepository implements ICruxAssetTranslatorRepository {
    private _assetMapping: IClientAssetMapping;
    constructor(options?: IManualCruxAssetTranslatorRepositoryOptions) {
        if (!options || !options.assetMapping) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.MissingAssetMapping);
        }
        this._assetMapping = options && options.assetMapping;
        log.info("ManualCruxAssetTranslatorRepository initialised");
    }
    public get = async (): Promise<CruxAssetTranslator> => {
        const supportedAssetList = CruxSpec.globalAssetList.filter((asset) => Object.values(this._assetMapping).includes(asset.assetId));
        return new CruxAssetTranslator(this._assetMapping, supportedAssetList);
    }
    public save = async (cruxAssetTranslator: CruxAssetTranslator, keyManager: IKeyManager): Promise<CruxAssetTranslator> => {
        throw ErrorHelper.getPackageError(null, PackageErrorCode.IsNotSupported);
    }
    public restore = async (keyManager: IKeyManager): Promise<CruxAssetTranslator|undefined> => {
        return this.get();
    }
}
