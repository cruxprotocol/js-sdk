import { CruxAssetTranslator } from "../entities/crux-asset-translator";
import { IKeyManager } from "./key-manager";
export interface ICruxAssetTranslatorRepository {
    get: (domain: string) => Promise<CruxAssetTranslator|undefined>;
    save: (cruxAssetTranslator: CruxAssetTranslator, keyManager: IKeyManager) => Promise<CruxAssetTranslator>;
    restore: (keyManager: IKeyManager) => Promise<CruxAssetTranslator|undefined>;
}
// tslint:disable-next-line: no-empty-interface
export interface ICruxAssetTranslatorRepositoryOptions {}
export type ICruxAssetTranslatorRepositoryConstructor = new (options?: ICruxAssetTranslatorRepositoryOptions) => ICruxAssetTranslatorRepository;
