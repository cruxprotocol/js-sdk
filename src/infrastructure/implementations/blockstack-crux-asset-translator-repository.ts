import { CruxAssetTranslator } from "../../core/entities/crux-asset-translator";
import { ICruxAssetTranslatorRepository } from "../../core/interfaces/crux-asset-translator-repository";
import { IKeyManager } from "../../core/interfaces/key-manager";
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
