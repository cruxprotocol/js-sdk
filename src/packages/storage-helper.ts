import {StorageService} from "./storage";

export class StorageHelper {
    private storageService: StorageService;
    constructor(storageService: StorageService) {
        this.storageService = storageService;
    }

    public setJSONAsync = async (key: string, jsonObj: object): Promise<void> => {
        const objString = JSON.stringify(jsonObj);
        if (!this.storageService.isSync) {
            return this.storageService.setItemAsync(key, objString);
        }
        return Promise.resolve(this.storageService.setItem(key, objString));
    }
    public setItemAsync = async (key: string, value: string): Promise<void> => {
        if (!this.storageService.isSync) {
            return this.storageService.setItemAsync(key, value);
        }
        return Promise.resolve(this.storageService.setItem(key, value));
    }
    public getJSONAsync = async (key: string): Promise<object|null> => {
        let objString: string | null;
        if (!this.storageService.isSync) {
            objString = await this.storageService.getItemAsync(key);
        } else {
            objString = this.storageService.getItem(key);
        }
        if (objString) {
            return Promise.resolve(JSON.parse(objString));
        } else {
            return Promise.resolve(null);
        }
    }
    public getItemAsync = async (key: string): Promise<string|null> => {
        if (!this.storageService.isSync) {
            return this.storageService.getItemAsync(key);
        }
        return Promise.resolve(this.storageService.getItem(key));
    }

}
