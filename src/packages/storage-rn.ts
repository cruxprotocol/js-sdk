
import {StorageService} from "./storage";
const MEMORY_KEY_PREFIX = "@CruxPay:";

export class RNLocalStorage extends StorageService {

    private dataMemory: any;

    constructor() {
        super();
        this.dataMemory = {};
    }

    public setItem = async (key: string, value: string) => {
        // AsyncStorage.setItem(MEMORY_KEY_PREFIX + key, value);
        this.dataMemory[key] = value;
        return Promise.resolve(this.dataMemory[key]);
    }

    public getItem = async (key: string) => {
        return Promise.resolve(Object.prototype.hasOwnProperty.call(this.dataMemory, key) ? this.dataMemory[key] : undefined);
    }
}
