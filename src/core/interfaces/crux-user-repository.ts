import { CruxDomainId, CruxId } from "../../packages/identity-utils";
import { CruxUser } from "../entities/crux-user";
import { IKeyManager } from "./key-manager";

export interface ICruxUserRepository {
    isCruxIdAvailable: (cruxID: CruxId) => Promise<boolean>;
    create: (cruxID: CruxId, keyManager: IKeyManager) => Promise<CruxUser>;
    getByCruxId: (cruxID: CruxId, tag?: string) => Promise<CruxUser|undefined>;
    getWithKey: (keyManager: IKeyManager, cruxDomainId: CruxDomainId) => Promise<CruxUser|undefined>;
    save: (cruxUser: CruxUser, keyManager: IKeyManager) => Promise<CruxUser>;
    // restore: (keyManager: IKeyManager) => Promise<CruxUser|undefined>;
}
// tslint:disable-next-line: no-empty-interface
export interface ICruxUserRepositoryOptions {}
export type ICruxUserRepositoryConstructor = new (options?: ICruxUserRepositoryOptions) => ICruxUserRepository;
