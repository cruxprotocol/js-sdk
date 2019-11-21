import {StorageService} from "./storage"

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
