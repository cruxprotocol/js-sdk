import {StorageService} from "./storage";

const config: any = {};

export class CoreManager {
    // public get = (key: string): any => {
    //     if (config.hasOwnProperty(key)) {
    //         return config[key];
    //     }
    //     throw new Error("Configuration key not found: " + key);
    // }
    //
    // public set = (key: string, value: any): void => {
    //     config[key] = value;
    // }

    public static setStorageService = (service: StorageService) => {
        config.StorageService = service;
    }

    public static getStorageService = (): StorageService => {
        return config.StorageService;
    }
}
