import { CruxAssetTranslator } from "../entities/crux-asset-translator";
import { IKeyManager } from "./key-manager";
// CruxAssetTranslator
export interface ICruxAssetTranslatorRepository {
    create: (domain: string, keyManager: IKeyManager) => Promise<CruxAssetTranslator>;
    get: (domain: string) => Promise<CruxAssetTranslator>;
    save: (cruxAssetTranslator: CruxAssetTranslator, keyManager: IKeyManager) => Promise<void>;
}
