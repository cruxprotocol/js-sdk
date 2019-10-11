import request from "request";
import {getLogger} from "../index";
import { LocalStorage } from "./storage";

const log = getLogger(__filename);

/* istanbul ignore next */
const httpJSONRequest = (options: (request.UriOptions & request.CoreOptions) | (request.UrlOptions & request.CoreOptions)): Promise<object> => {
    log.debug("network_call:", options);
    const promise: Promise<object> = new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) { reject(new Error(error)); }
            resolve(body);
        });
    });
    return promise;
};

const sanitizePrivKey = (privKey: string): string => {
    if (privKey.length === 66 && privKey.slice(64) === "01") {
        privKey = privKey.slice(0, 64);
    }
    return privKey;
};

const cachedFunctionCall = async (cacheKey: string, ttl: number = 3600, fn: (...args: any[]) => any, paramArray: any[], skipConditional?: (returnValue: any) => Promise<boolean>): Promise<any> => {
    const storage = new LocalStorage();
    const storageCacheKey = `crux_cache_${cacheKey}`;
    const cachedValue = storage.getItem(storageCacheKey);
    const cachedExpiry = Number(storage.getItem(storageCacheKey + ":exp"));
    if (cachedValue && cachedExpiry && (new Date(cachedExpiry) > new Date())) {
        log.debug(`using cachedValue from storage for key ${storageCacheKey}`);
        try {
            return JSON.parse(cachedValue);
        } catch (error) {
            return cachedValue;
        }
    }
    const newValue = await fn.apply(fn, paramArray);
    const skipCache = skipConditional && await skipConditional(newValue) || false;
    if (newValue && !skipCache) {
        const stringValue = typeof newValue === "string" ? newValue : JSON.stringify(newValue);
        storage.setItem(storageCacheKey, stringValue);
        storage.setItem(storageCacheKey + ":exp", ((ttl * 1000) + Date.now()).toString());
    }
    return newValue;
};

export {
    httpJSONRequest,
    sanitizePrivKey,
    cachedFunctionCall,
};
