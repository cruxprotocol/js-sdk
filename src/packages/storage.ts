import {getLogger} from "..";

const log = getLogger(__filename);

// Storage service abstraction
/* istanbul ignore next */
export abstract class StorageService {
    public abstract setItem = async (key: string, value: string): Promise<void> => undefined;
    public abstract getItem = async (key: string): Promise<string | null> => null;

    public setJSON = async (key: string, jsonObj: object): Promise<void> => {
        const objString = JSON.stringify(jsonObj);
        return this.setItem(key, objString);
    }
    public getJSON = async (key: string): Promise<object | null> => {
        const objString = await this.getItem(key);
        if (objString) {
            return Promise.resolve(JSON.parse(objString));
        } else {
            return Promise.resolve(null);
        }
    }
}
