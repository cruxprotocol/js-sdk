import { CruxAssetTranslator } from "../../core/entities/crux-asset-translator";
import { CruxSpec } from "../../core/entities/crux-spec";
import { ICruxBlockstackInfrastructure } from "../../core/interfaces";
import { ICruxAssetTranslatorRepository, ICruxAssetTranslatorRepositoryOptions } from "../../core/interfaces/crux-asset-translator-repository";
import { IKeyManager } from "../../core/interfaces/key-manager";
import { ErrorHelper, PackageErrorCode } from "../../packages/error";
import { getLogger } from "../../packages/logger";
import { BlockstackService } from "../services/blockstack-service";
const log = getLogger(__filename);
export interface IBlockstackCruxAssetTranslatorRepositoryOptions extends ICruxAssetTranslatorRepositoryOptions {
    blockstackInfrastructure: ICruxBlockstackInfrastructure;
    domainContext?: string;
    bnsOverrides?: string[];
}
export class BlockstackCruxAssetTranslatorRepository implements ICruxAssetTranslatorRepository {
    private blockstackService: BlockstackService;
    private _domainContext: string;
    constructor(options: IBlockstackCruxAssetTranslatorRepositoryOptions) {
        this.blockstackService = new BlockstackService({
            bnsOverrides: options.bnsOverrides,
            infrastructure: options.blockstackInfrastructure,
        });
        if (!options || !options.domainContext) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.MissingDomainContext);
        }
        this._domainContext = options && options.domainContext;
        log.info("BlockstackCruxAssetTranslatorRepository initialised");
    }
    public get = async (): Promise<CruxAssetTranslator|undefined> => {
        const clientConfig = await this.blockstackService.getClientConfig(this._domainContext);
        if (!clientConfig) {
            return;
        }
        return new CruxAssetTranslator(clientConfig.assetMapping);
    }
    public save = async (cruxAssetTranslator: CruxAssetTranslator, keyManager: IKeyManager): Promise<CruxAssetTranslator> => {
        const clientConfig = await this.blockstackService.getClientConfig(this._domainContext);
        clientConfig.assetMapping = cruxAssetTranslator.assetMapping;
        clientConfig.assetList = CruxSpec.globalAssetList.filter((asset) => Object.values(cruxAssetTranslator.assetMapping).includes(asset.assetId));
        await this.blockstackService.putClientConfig(this._domainContext, clientConfig, keyManager);
        return new CruxAssetTranslator(clientConfig.assetMapping);
    }
    public restore = async (keyManager: IKeyManager): Promise<CruxAssetTranslator|undefined> => {
        const associatedDomain = await this.blockstackService.restoreDomain(keyManager, this._domainContext);
        if (!associatedDomain) {
            return;
        }
        return this.get();
    }
}
