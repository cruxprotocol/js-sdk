import { IKeyManager } from "../../../../core/interfaces/key-manager";

export interface IKeyStore {
    getKeyManager: (apiKey: string) => Promise<IKeyManager>;
    addToKeyStore: (apiKey: string, privateKey: string) => void;
    removeFromKeyStore: (apiKey: string) => void;
}
