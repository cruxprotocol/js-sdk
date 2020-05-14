import {makeUUID4} from "blockstack/lib";
import * as https from "https";
import {IKeyManager} from "../../core/interfaces";
import {CruxId} from "../../packages";
import {BasicKeyManager} from "./basic-key-manager";

function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        // tslint:disable-next-line:no-bitwise prefer-const
        let r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// export const getServiceKeyManager = (httpClient: ICruxKeyManagerProxyHTTPClient) => {
//     return ServiceKeyManager(httpClient);
// }
export const cruxDefaultRequester = (payload: string) => {
    // make http request to
};

export interface IAuthToken {
    apiKey: string;
    messageHash: string;
    signedMessageHash: string;
    validTill: number;
}

interface IKeyStore {
    get(cruxId: CruxId): any;
}

interface IAuthTokenService {
    verify(apiKey: string, authToken: any): void;
}
const basicKeyManagerExecutor = (key: string, method: string, args: any) => {
    const keyManager = new BasicKeyManager(key);
    // @ts-ignore
    // tslint:disable-next-line:tsr-detect-unsafe-properties-access
    return keyManager[method](args);
    // TODO: Invoke method in keymanager as per args and send result
};

// This will run on CruxPay.com server
export class ApiSecretKeyManager {
    private authTokenService: IAuthTokenService;
    private keyStore: IKeyStore;
    constructor(authTokenService: IAuthTokenService, keyStore: IKeyStore) {
        this.authTokenService = authTokenService;
        this.keyStore = keyStore;
    }
    public execute = async (apiKey: string, authToken: any, cruxId: CruxId, method: string, args: any) => {
        this.authTokenService.verify(apiKey, authToken);
        const key = this.getKey(cruxId);
        return basicKeyManagerExecutor(key, method, args);
    }
    private getKey = (cruxId: CruxId) => {
        const key = this.keyStore.get(cruxId);
        if (!key) {
            throw Error("Unsupported CruxID");
        }
        return key;
    }
}

export interface IKeyManagerProxy {
    invoke(requestPayloadObj: { invocation: any; claimedId: CruxId; invocationId: string }): Promise<any>;
}

export class HTTPKeyManagerProxy implements IKeyManagerProxy {
    private keyManagerUrl: string;
    private apiKey: string;
    constructor(keyManagerUrl: string, apiKey: string) {
        this.keyManagerUrl = keyManagerUrl;
        this.apiKey = apiKey;
    }
    public invoke = (requestPayloadObj: { invocation: any; claimedId: CruxId; invocationId: string }): Promise<any> => {
        return new Promise((resolve, reject) => {
            const res =  https.request(this.keyManagerUrl, {
                method: "POST",
                // tslint:disable-next-line:object-literal-sort-keys
                path: "/execute",
                // tslint:disable-next-line:object-literal-sort-keys
                headers: {
                    "x-api-key": this.apiKey,
                },
            });
            res.on("data", (d) => {
                resolve(d);
            });
        });
    }
}

export class ProxyKeyManager implements IKeyManager {
    private claimedId: CruxId;
    private proxy: IKeyManagerProxy;
    constructor(claimedId: CruxId, proxy: IKeyManagerProxy) {
        this.claimedId = claimedId;
        this.proxy = proxy;
    }
    public deriveSharedSecret = async (publicKey: string): Promise<string> => {
        return this.makeRequest({
            args: [publicKey],
            method: "deriveSharedSecret",
        });
    }
    public getPubKey = async (): Promise<string> => {
        return this.makeRequest({
            args: [],
            method: "getPubKey",
        });

    }
    public signWebToken = async (payload: any): Promise<string> => {
        return this.makeRequest({
            args: [payload],
            method: "signWebToken",
        });
    }
    private makeRequest = (invocation: any): any => {
        const invocationId = makeUUID4();
        const requestPayloadObj = {
            claimedId: this.claimedId,
            invocation,
            invocationId,
        };
        return this.proxy.invoke(requestPayloadObj);
    }
}
