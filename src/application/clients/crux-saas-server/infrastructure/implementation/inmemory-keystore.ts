import { IKeyManager } from "../../../../../core/interfaces/key-manager";
import { BasicKeyManager } from "../../../../../infrastructure/implementations/basic-key-manager";
import { IKeyStore } from "../../interfaces/key-store";

export class InmemoryKeyStore implements IKeyStore {
    private keyStore: { [key: string]: any } ;
    constructor() {
        this.keyStore = {};
    }
    public getKeyManager = async (uniqueIdentifier: string): Promise<IKeyManager> => {
        return new BasicKeyManager(this.getPrivateKey(uniqueIdentifier));
    }

    public addToKeyStore = (uniqueIdentifier: string, privateKey: string) => {
        this.keyStore[uniqueIdentifier] = {
            enabled: true,
            privateKey,
        };
    }

    public removeFromKeyStore = (uniqueIdentifier: string) => {
        const keyStoreObj = this.keyStore[uniqueIdentifier];
        if (keyStoreObj) {
            this.keyStore[uniqueIdentifier].enabled = false;
        }
    }

    private getPrivateKey = (uniqueIdentifier: string): string => {
        const keyStoreObj = this.keyStore[uniqueIdentifier];
        if (keyStoreObj && keyStoreObj.enabled) {
            return keyStoreObj.privateKey;
        }
        throw new Error("Wrong / removed uniqueIdentifier");
    }
}
