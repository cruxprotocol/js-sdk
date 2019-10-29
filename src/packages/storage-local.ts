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

    public setItem = async (key: string, value: string): Promise<void> => {
        this.storage.setItem(key, value);
    }

    public getItem = async (key: string): Promise<string | null> => {
        return this.storage.getItem(key);
    }
}
