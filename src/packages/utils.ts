import * as bitcoin from "bitcoinjs-lib";
import fetch from "node-fetch";
import {getLogger} from "../index";
import { IBitcoinKeyPair } from "./name-service/blockstack-service";
import {RNLocalStorage} from "./storage-rn";

const log = getLogger(__filename);

/* istanbul ignore next */
const httpJSONRequest = (options: any): Promise<object> => {
    log.debug("network_call:", options);
    const promise: Promise<object> = new Promise((resolve, reject) => {

        const fetchOptions = JSON.parse(JSON.stringify(options));
        delete fetchOptions.baseUrl;
        delete fetchOptions.url;
        let url: string = "";
        if (options.baseUrl) {
            url += options.baseUrl;
        }
        if (options.url) {
            url += options.url;
        }
        fetch(url, fetchOptions)
            .then((res) => res.json())
            .then((json) => resolve(json))
            .catch((err) => reject(new Error(err)));

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
    const storage = new RNLocalStorage();
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
