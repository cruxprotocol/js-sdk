import { CruxAssetTranslator } from "../../core/entities/crux-asset-translator";
import { CruxSpec } from "../../core/entities/crux-spec";
import { ICruxAssetTranslatorRepository, ICruxAssetTranslatorRepositoryOptions } from "../../core/interfaces/crux-asset-translator-repository";
import { IKeyManager } from "../../core/interfaces/key-manager";
import { ErrorHelper, PackageErrorCode } from "../../packages/error";
import { getLogger } from "../../packages/logger";
import { BlockstackService } from "../services/blockstack-service";
const log = getLogger(__filename);
export interface IBlockstackCruxAssetTranslatorRepositoryOptions extends ICruxAssetTranslatorRepositoryOptions {
    domainContext?: string;
    bnsNodes?: string[];
}
export class BlockstackCruxAssetTranslatorRepository implements ICruxAssetTranslatorRepository {
    private _bnsNodes: string[];
    private _domainContext: string;
    constructor(options?: IBlockstackCruxAssetTranslatorRepositoryOptions) {
        this._bnsNodes = options && options.bnsNodes && [...new Set([...CruxSpec.blockstack.bnsNodes, ...options.bnsNodes])] || CruxSpec.blockstack.bnsNodes;
        if (!options || !options.domainContext) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.MissingDomainContext);
        }
        this._domainContext = options && options.domainContext;
        log.info("BlockstackCruxAssetTranslatorRepository initialised");
    }
    public get = async (): Promise<CruxAssetTranslator|undefined> => {
        const clientConfig = await BlockstackService.getClientConfig(this._domainContext, this._bnsNodes);
        return new CruxAssetTranslator(clientConfig.assetMapping, clientConfig.assetList);
    }
    public save = async (cruxAssetTranslator: CruxAssetTranslator, keyManager: IKeyManager): Promise<CruxAssetTranslator> => {
        const clientConfig = await BlockstackService.getClientConfig(this._domainContext, this._bnsNodes);
        clientConfig.assetMapping = cruxAssetTranslator.assetMapping;
        clientConfig.assetList = CruxSpec.globalAssetList.filter((asset) => Object.values(cruxAssetTranslator.assetMapping).includes(asset.assetId));
        await BlockstackService.putClientConfig(this._domainContext, clientConfig, this._bnsNodes, keyManager);
        return new CruxAssetTranslator(clientConfig.assetMapping, clientConfig.assetList);
    }
    public restore = async (keyManager: IKeyManager): Promise<CruxAssetTranslator|undefined> => {
        const associatedDomain = await BlockstackService.restoreDomain(keyManager, this._bnsNodes, this._domainContext);
        if (!associatedDomain) {
            return;
        }
        return this.get();
    }
}
