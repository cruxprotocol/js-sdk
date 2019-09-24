import { getLogger } from "..";

const log = getLogger(__filename);

// Stroage service abstraction

export abstract class StorageService {
    public abstract setItem = (key: string, value: string): void => {return; };
    public abstract getItem = (key: string): string | null => null;
    public abstract getJSON = (key: string): object | null => null;
    public abstract setJSON = (key: string, jsonObj: object): void => {return; };
}

// LocalStrorage service implementation

export class LocalStorage extends StorageService {
    private storage: Storage;

    constructor(persist: boolean = true) {
        super();
        if (!persist) {
            this.storage = sessionStorage;
            log.info(`Using sessionStorage as StorageService`);
        } else {
            this.storage = localStorage;
            log.info(`Using localStorage as StorageService`);
        }
    }

    public setItem = (key: string, value: string): void => {
        this.storage.setItem(key, value);
    }

    public getItem = (key: string): string|null => {
        return this.storage.getItem(key);
    }

    public setJSON = (key: string, jsonObj: object): void => {
        const objString = JSON.stringify(jsonObj);
        this.storage.setItem(key, objString);
    }

    public getJSON = (key: string): object | null => {
        const objString = this.storage.getItem(key);
        if (objString) {
            return JSON.parse(objString);
        } else {
            return null;
        }
    }
}
