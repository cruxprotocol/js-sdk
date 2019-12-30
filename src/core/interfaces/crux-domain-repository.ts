import { CruxDomain } from "../entities/crux-domain";
import { IKeyManager } from "./key-manager";
export interface ICruxDomainRepository {
    find: (domain: string) => Promise<boolean>;
    create: (domain: string, keyManager: IKeyManager) => Promise<CruxDomain>;
    get: (domain: string) => Promise<CruxDomain|undefined>;
    save: (cruxDomain: CruxDomain, keyManager: IKeyManager) => Promise<CruxDomain>;
    restore: (keyManager: IKeyManager, domainContext?: string) => Promise<CruxDomain|undefined>;
}
// tslint:disable-next-line: no-empty-interface
export interface ICruxDomainRepositoryOptions {}
export type ICruxDomainRepositoryConstructor = new (options?: ICruxDomainRepositoryOptions) => ICruxDomainRepository;
