import * as bitcoin from "bitcoinjs-lib";
import request from "request";
import {getLogger} from "../index";
import { ErrorHelper, PackageErrorCode } from "./error";
import { IBitcoinKeyPair } from "./name-service/blockstack-service";
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

const cachedFunctionCall = async (cacheKey: string, ttl: number = 300, fn: (...args: any[]) => any, paramArray: any[], skipConditional?: (returnValue: any) => Promise<boolean>): Promise<any> => {
    const storage = new LocalStorage();
    const storageCacheKey = `crux_cache_${cacheKey}`;
    const cachedValue = await storage.getItem(storageCacheKey);
    const cachedExpiry = Number(await storage.getItem(storageCacheKey + ":exp"));
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
        await storage.setItem(storageCacheKey, stringValue);
        await storage.setItem(storageCacheKey + ":exp", ((ttl * 1000) + Date.now()).toString());
    }
    return newValue;
};

const getKeyPairFromPrivKey = (privKey: string): IBitcoinKeyPair => {
    let privateKey: string;
    // Convert the WIF format to hex
    if (privKey.startsWith("L") || privKey.startsWith("K")) {
        const keyPair = bitcoin.ECPair.fromWIF(privKey);
        privateKey = sanitizePrivKey((keyPair.privateKey as Buffer).toString("hex"));
    } else {
        privateKey = sanitizePrivKey(privKey);
    }

    // Try with hex encoding first, then with base64
    let publicKey: string;
    try {
        publicKey = bitcoin.ECPair.fromPrivateKey(Buffer.from(privateKey, "hex")).publicKey.toString("hex");
    } catch (error) {
        privateKey = sanitizePrivKey(Buffer.from(privKey, "base64").toString("hex"));
        try {
            publicKey = bitcoin.ECPair.fromPrivateKey(Buffer.from(privateKey, "hex")).publicKey.toString("hex");
        } catch (error) {
            throw ErrorHelper.getPackageError(PackageErrorCode.InvalidPrivateKeyFormat);
        }
    }

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
