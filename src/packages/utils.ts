import * as bitcoin from "bitcoinjs-lib";
import request from "request";
import {getLogger} from "../index";
import {IBitcoinKeyPair, MNEMONIC_STORAGE_KEY} from "./name-service/blockstack-service";
import { LocalStorage } from "./storage";
import {StorageHelper} from "./storage-helper";

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

const cachedFunctionCall = async (cacheKey: string, ttl: number = 300, fn: (...args: any[]) => any, paramArray: any[], skipConditional?: (returnValue: any) => Promise<boolean>): Promise<any> => {
    const storage = new LocalStorage();
    const storageCacheKey = `crux_cache_${cacheKey}`;
    const cachedValue = await new StorageHelper(storage).getItemAsync(storageCacheKey);
    const cachedExpiry = Number(await new StorageHelper(storage).getItemAsync(storageCacheKey + ":exp"));
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
        await new StorageHelper(storage).setItemAsync(storageCacheKey, stringValue);
        await new StorageHelper(storage).setItemAsync(storageCacheKey + ":exp", ((ttl * 1000) + Date.now()).toString());
    }
    return newValue;
};

const getKeyPairFromPrivKey = (privKey: string): IBitcoinKeyPair => {
    const privateKey = sanitizePrivKey(privKey);
    const publicKey = bitcoin.ECPair.fromPrivateKey(Buffer.from(privateKey, "hex")).publicKey.toString("hex");
    const address = bitcoin.payments.p2pkh({ pubkey: Buffer.from(publicKey, "hex") }).address;
    return {
        address: address as string,
        privKey: privateKey,
        pubKey: publicKey,
    };
};

export {
    httpJSONRequest,
    sanitizePrivKey,
    cachedFunctionCall,
    getKeyPairFromPrivKey,
};
