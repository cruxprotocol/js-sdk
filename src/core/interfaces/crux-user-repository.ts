import { CruxId } from "../../packages/identity-utils";
import { CruxUser, IAddress } from "../entities/crux-user";
import { IKeyManager } from "./key-manager";

export interface ICruxUserRepository {
    find: (cruxID: CruxId) => Promise<boolean>;
    create: (cruxID: CruxId, keyManager: IKeyManager) => Promise<CruxUser>;
    getByCruxId: (cruxID: CruxId) => Promise<CruxUser|undefined>;
    getWithKey: (keyManager: IKeyManager) => Promise<CruxUser|undefined>;
    save: (cruxUser: CruxUser, keyManager: IKeyManager) => Promise<CruxUser>;
    // restore: (keyManager: IKeyManager) => Promise<CruxUser|undefined>;
}
// tslint:disable-next-line: no-empty-interface
export interface ICruxUserRepositoryOptions {}
export type ICruxUserRepositoryConstructor = new (options?: ICruxUserRepositoryOptions) => ICruxUserRepository;
