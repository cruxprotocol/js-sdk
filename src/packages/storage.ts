import { getLogger } from "..";

const log = getLogger(__filename);

// Storage service abstraction
/* istanbul ignore next */
export abstract class StorageService {
    public isSync: boolean;
    public abstract setItem = (key: string, value: string): void => undefined;
    public abstract getItem = (key: string): string | null => null;
    public abstract async getItemAsync(key: string): Promise<string | null>;
    public abstract async setItemAsync(key: string, value: string): Promise<void>;

}

// LocalStorage service implementation
export class LocalStorage extends StorageService {
    private storage: Storage;

    constructor() {
        super();
        this.storage = localStorage;
        this.isSync = true;
        log.info(`Using localStorage as StorageService`);
    }

    public setItem = (key: string, value: string): void => {
        this.storage.setItem(key, value);
    }

    public getItem = (key: string): string | null => {
        return this.storage.getItem(key);
    }
}
