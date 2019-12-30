import { CruxDomainId } from "../../packages/identity-utils";
import { CruxDomain } from "../entities/crux-domain";
import { IKeyManager } from "./key-manager";
export interface ICruxDomainRepository {
    find: (domainId: CruxDomainId) => Promise<boolean>;
    create: (domainId: CruxDomainId, keyManager: IKeyManager) => Promise<CruxDomain>;
    get: (domainId: CruxDomainId) => Promise<CruxDomain|undefined>;
    save: (cruxDomain: CruxDomain, keyManager: IKeyManager) => Promise<CruxDomain>;
    restore: (keyManager: IKeyManager, domainId?: CruxDomainId) => Promise<CruxDomain|undefined>;
}
// tslint:disable-next-line: no-empty-interface
export interface ICruxDomainRepositoryOptions {}
export type ICruxDomainRepositoryConstructor = new (options?: ICruxDomainRepositoryOptions) => ICruxDomainRepository;
