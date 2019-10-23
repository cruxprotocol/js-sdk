import {getLogger} from "..";
import {StorageService} from "./storage";

const log = getLogger(__filename);

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
