import * as CruxPay from "./index";
import {StorageService} from "./packages/storage";
declare global {
    interface Window {
        CruxPay: object;
        inmemStorage: object;
        inmemStorageWithClaim: InMemStorage;
    }
}

export class InMemStorage extends StorageService {
    private dataMemory: any;
    constructor() {
        super();
        this.dataMemory = {};
    }

    public setItem = async (key: string, value: string): Promise<void> => {
        this.dataMemory[key] = value;
    }

    public getItem = async (key: string): Promise<string | null> => {
        return this.dataMemory[key];
    }
}

window.inmemStorage = new InMemStorage();
window.inmemStorageWithClaim = new InMemStorage();
window.inmemStorageWithClaim.setItem("payIDClaim", JSON.stringify({identitySecrets: "{\"iv\":\"59ZAnVm5vyC6zIZz\",\"encBuffer\":\"1JstBA1vk8LpSfI9kPlGtWytcAZUbGN51g5E8NA/OVXjSsygdjdceeW0bb/2GbR9qkkq4P7nuP9lCjxbXWcsJaj/0AWUOA82AmZnbP7yUH8ATQwdSgyhUQDGboSVsO2JYFg1tPg2P+kA0jIoRYYGpAlcT8hhEe5jRSp9NBZ2cFWV/z3yDRMZtXHUQtwY/bPenREqBv7iBgwnqWLzrDMoY+KrjOXzUC3BWCByYfj02WkXLq6tQnJyPepCl1OGhpfoDCBgRbrIZ+uJxDp0RrAbp52OSREPaHPF/6oShTm5Pre1ZswBxufqwWMfNARY0wA=\"}", virtualAddress: "yadu007@cruxdev.crux"}));

window.CruxPay = CruxPay;
