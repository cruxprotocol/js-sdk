import { ICruxAssetTranslatorRepository, IKeyManager } from "../../domain-entities";
import { CruxAssetTranslator } from "../../domain-entities/crux-asset-translator";
import { getLogger } from "../../packages/logger";

const log = getLogger(__filename);

export class BlockstackCruxAssetTranslatorRepository implements ICruxAssetTranslatorRepository {
    constructor() {
        log.info("BlockstackCruxAssetTranslatorRepository initialised");
    }
    public create = async (domain: string, keyManager: IKeyManager): Promise<CruxAssetTranslator> => {
        return new CruxAssetTranslator();
    }
    public get = async (domain: string): Promise<CruxAssetTranslator> => {
        return new CruxAssetTranslator();
    }
    public save = async (cruxAssetTranslator: CruxAssetTranslator, keyManager: IKeyManager) => {
        return;
    }
}
