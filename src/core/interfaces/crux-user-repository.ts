import { CruxDomainId, CruxId } from "../../packages/identity-utils";
import { CruxDomain } from "../entities/crux-domain";
import { CruxUser } from "../entities/crux-user";
import { IKeyManager } from "./key-manager";

export interface ICruxUserRepository {
    isCruxIdAvailable: (cruxIDSubdomain: string) => Promise<boolean>;
    create: (cruxIDSubdomain: string, keyManager: IKeyManager) => Promise<CruxUser>;
    getByCruxId: (cruxID: CruxId, tag?: string, onlyRegistered?: boolean) => Promise<CruxUser|undefined>;
    getWithKey: (keyManager: IKeyManager) => Promise<CruxUser|undefined>;
    save: (cruxUser: CruxUser, keyManager: IKeyManager) => Promise<CruxUser>;
    // restore: (keyManager: IKeyManager) => Promise<CruxUser|undefined>;
}
export interface ICruxUserRepositoryOptions {
    cruxDomain?: CruxDomain;
}
export type ICruxUserRepositoryConstructor = new (options?: ICruxUserRepositoryOptions) => ICruxUserRepository;
