import { CruxDomain } from "../entities/crux-domain";
import { IKeyManager } from "./key-manager";
export interface ICruxDomainRepository {
    find: (domain: string) => Promise<boolean>;
    create: (domain: string, keyManager: IKeyManager) => Promise<CruxDomain>;
    get: (domain?: string, keyManager?: IKeyManager) => Promise<CruxDomain | null>;
    save: (cruxDomain: CruxDomain, keyManager: IKeyManager) => Promise<void>;
}
