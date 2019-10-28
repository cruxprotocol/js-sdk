import {StorageService} from "./storage"

const config: any = {};

function requireMethods(name: string, methods: string[], controller: any) {
    methods.forEach((func) => {
        if (typeof controller[func] !== "function") {
            throw new Error(`${name} must implement ${func}()`);
        }
    });
}

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
        if (service.isSync) {
            requireMethods("An async StorageService", [
                "getItemAsync",
                "setItemAsync",
            ], service);
        } else {
            requireMethods("A synchronous StorageController", [
                "getItem",
                "setItem",
            ], service);
        }
        config.StorageService = service;
    }

    public static getStorageService = (): StorageService => {
        return config.StorageService;
    }
}
