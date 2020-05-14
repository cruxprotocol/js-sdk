import * as bitcoin from "bitcoinjs-lib";
import * as cloner from "cloner";
import request from "request";
import URL from "url-parse";
import { BaseError, ErrorHelper, PackageErrorCode } from "./error";
import { getLogger } from "./logger";
import { StorageService } from "./storage";

const log = getLogger(__filename);
const httpsPrefixRegex = new RegExp(`^https:\/\/.+$`);

/* istanbul ignore next */
const httpJSONRequest = (options: (request.UriOptions & request.CoreOptions) | (request.UrlOptions & request.CoreOptions)): Promise<object> => {
    log.debug("network_call:", options);
    const promise: Promise<object> = new Promise((resolve, reject) => {
        const { url, fetchOptions } = translateRequestOptionsToFetchOptions(options);
        if (!httpsPrefixRegex.test(url)) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.InsecureNetworkCall);
        }
        fetch(url, fetchOptions)
            .then((res) => {
                if (res.status === 404) {
                    reject(ErrorHelper.getPackageError(null, PackageErrorCode.Response404, url));
                } else if (res.status === 401) {
                    reject(ErrorHelper.getPackageError(null, PackageErrorCode.Response401, url));
                } else {
                    return res.json();
                }
            })
            .then((json) => resolve(json))
            .catch((err) => reject(new BaseError(null, err)));
    });
    return promise;
};

const translateRequestOptionsToFetchOptions = (options: any): { url: string, fetchOptions: RequestInit} => {
    const fetchOptions = Object.assign({}, options);
    delete fetchOptions.baseUrl;
    delete fetchOptions.url;
    let url: string = "";
    if (options.baseUrl) {
        url += options.baseUrl;
    }
    if (options.url) {
        url += options.url;
    }
    if (options.qs) {
        const str = [];
        for (const p in options.qs) {
            if (options.qs.hasOwnProperty(p)) {
                str.push(p + "=" + options.qs[p]);
            }
        }
        url += "?" + str.join("&");
    }
    if (options.body) {
        fetchOptions.body = JSON.stringify(options.body);
    }
    return {url, fetchOptions};
};

const sanitizePrivKey = (privKey: string): string => {
    if (privKey.length === 66 && privKey.slice(64) === "01") {
        privKey = privKey.slice(0, 64);
    }
    return privKey;
};

const sanitizeUrl = (url: string): string => {
    const parsedUrl = new URL(url);
    // TODO: sanitize the pathname
    const restrictedCharacters = "!@#$^&%*()+=[]{}|:<>?,.";
    if (parsedUrl.pathname.split("").some((ch: string) => restrictedCharacters.indexOf(ch) !== -1)) {
        throw new BaseError(null, `Url path: ${parsedUrl.pathname} contains invalid characters`);
    }
    return `${parsedUrl.origin}${parsedUrl.pathname}`;
};

const trimTrailingSlash = (value: string): string => {
    return value.replace(/\/$/, "");
};

const getRandomHexString = (length: number = 32): string => {
    const randomValues = crypto.getRandomValues(new Uint8Array(length));
    let result: string = "";
    let i: number;
    for (i = 0; i < randomValues.length; i++) {
        result = result + (randomValues[i].toString(16).toUpperCase());
    }
    return result;
};

const cachedFunctionCall = async (storage: StorageService|undefined, cacheKey: string, ttl: number = 300, fn: (...args: any[]) => any, paramArray: any[], skipConditional?: (returnValue: any) => Promise<boolean>): Promise<any> => {
    if (!storage) {
        log.info("cacheStorage is missing, making a direct call");
        return fn.apply(fn, paramArray);
    }
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

const cloneValue = (obj: any): any => {
    return cloner.deep.copy(obj);
};

const getKeyPairFromPrivKey = (privKey: string): {
    privKey: string;
    pubKey: string;
    address: string;
} => {
    let privateKey: string;
    // Convert the WIF format to hex
    if (privKey.startsWith("L") || privKey.startsWith("K")) {
        const keyPair = bitcoin.ECPair.fromWIF(privKey);
        if (keyPair.privateKey) {
            privateKey = sanitizePrivKey((keyPair.privateKey).toString("hex"));
        } else {
            throw new BaseError(null, "Missing private key in generated EC Pair");
        }
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
            throw ErrorHelper.getPackageError(error, PackageErrorCode.InvalidPrivateKeyFormat);
        }
    }

    const address = bitcoin.payments.p2pkh({ pubkey: Buffer.from(publicKey, "hex") }).address;
    if (!address) {
        throw new BaseError(null, "No address found corresponding this public key");
    }
    return {
        address,
        privKey: privateKey,
        pubKey: publicKey,
    };
};

export class BufferJSONSerializer {
    public static bufferObjectToJSONString = (payload: { [key: string]: any }): string => {
        const objWithStringValues: { [key: string]: string } = {};
        for (const key of Object.keys(payload)) {
            objWithStringValues[key] = payload[key].toString("hex");
        }
        return JSON.stringify(objWithStringValues);
    }
    public static JSONStringToBufferObject = (stringifiedObj: string): { [key: string]: any } => {
        const objWithStringValues = JSON.parse(stringifiedObj);
        const bufferObj: { [key: string]: any } = {};
        for (const key of Object.keys(objWithStringValues)) {
            bufferObj[key] = Buffer.from(objWithStringValues[key], "hex");
        }
        return bufferObj;
    }
}

export {
    httpJSONRequest,
    sanitizePrivKey,
    sanitizeUrl,
    cachedFunctionCall,
    getKeyPairFromPrivKey,
    getRandomHexString,
    cloneValue,
    trimTrailingSlash,
};
