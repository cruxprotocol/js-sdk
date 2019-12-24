import { PubkeyHashSigner } from "blockstack";
// DomainUtilities
export interface IKeyManager {
    signWebToken: (payload: any) => Promise<string>;
    getPubKey: () => Promise<string>;
    pubKeyHashSigner: () => Promise<PubkeyHashSigner>;
}
