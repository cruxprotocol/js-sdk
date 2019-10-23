
import {StorageService} from "./storage";
const MEMORY_KEY_PREFIX = "@CruxPay:";

export class RNLocalStorage extends StorageService {

    private dataMemory: any;

    constructor() {
        super();
        this.dataMemory = {};
    }

    public setItem = (key: string, value: string) => {
        // AsyncStorage.setItem(MEMORY_KEY_PREFIX + key, value);
        this.dataMemory[key] = value;
        return this.dataMemory[key];
    }

    public getItem = (key: string) => {
        return Object.prototype.hasOwnProperty.call(this.dataMemory, key) ? this.dataMemory[key] : undefined;
    }
}
