import { getLogger } from "..";

const log = getLogger(__filename);

// Storage service abstraction
/* istanbul ignore next */
export abstract class StorageService {
    public abstract setItem = (key: string, value: string): void => undefined;
    public abstract getItem = (key: string): string | null => null;

    public setJSON = (key: string, jsonObj: object): void => {
        const objString = JSON.stringify(jsonObj);
        this.setItem(key, objString);
    }
    public getJSON = (key: string): object | null => {
        const objString = this.getItem(key);
        if (objString) {
            return JSON.parse(objString);
        } else {
            return null;
        }
    }
}

// LocalStorage service implementation
export class LocalStorage extends StorageService {
    private storage: Storage;

    constructor() {
        super();
        this.storage = localStorage;
        log.info(`Using localStorage as StorageService`);
    }

    public setItem = (key: string, value: string): void => {
        this.storage.setItem(key, value);
    }

    public getItem = (key: string): string | null => {
        return this.storage.getItem(key);
    }
}
