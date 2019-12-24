import { PubkeyHashSigner } from "blockstack";
import { CruxAssetTranslator } from "./crux-asset-translator";
import { CruxDomain } from "./crux-domain";

// DomainUtilities

export interface IKeyManager {
    signWebToken: (payload: any) => Promise<string>;
    getPubKey: () => Promise<string>;
    pubKeyHashSigner: () => Promise<PubkeyHashSigner>;
}

// CruxDomain

export enum DomainRegistrationStatus {
    NONE = "NONE",
    PENDING = "PENDING",
    DONE = "DONE",
    REJECT = "REJECT",
}

export interface ICruxDomainRepository {
    find: (domain: string) => Promise<boolean>;
    create: (domain: string, keyManager: IKeyManager) => Promise<CruxDomain>;
    get: (domain?: string, keyManager?: IKeyManager) => Promise<CruxDomain|null>;
    save: (cruxDomain: CruxDomain, keyManager: IKeyManager) => Promise<void>;
}

// CruxAssetTranslator

export interface ICruxAssetTranslatorRepository {
    create: (domain: string, keyManager: IKeyManager) => Promise<CruxAssetTranslator>;
    get: (domain: string) => Promise<CruxAssetTranslator>;
    save: (cruxAssetTranslator: CruxAssetTranslator, keyManager: IKeyManager) => Promise<void>;
}
