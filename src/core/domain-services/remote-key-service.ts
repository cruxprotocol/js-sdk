import {makeUUID4} from "blockstack/lib";
import { CruxId } from "src/packages";
import { IKeyManager } from "../interfaces";
import { SecureCruxIdMessenger } from "./crux-messenger";

const VALID_METHODS = ["signWebToken", "getPubKey", "deriveSharedSecret", "decryptMessage"];

export class RemoteKeyClient {
    private secureCruxIdMessenger: SecureCruxIdMessenger;
    private remoteUserId: CruxId;

    constructor(secureCruxIdMessenger: SecureCruxIdMessenger, remoteUserId: CruxId) {
        this.secureCruxIdMessenger = secureCruxIdMessenger;
        this.remoteUserId = remoteUserId;
    }

    public async invoke(method: string, args: any[]) {
        if (!this.secureCruxIdMessenger) {
            throw Error("RemoteKeyClient cannot send with no selfMessenger");
        }
        const methodData = this.generateMethodData(method, args);

        await this.secureCruxIdMessenger.send(methodData, this.remoteUserId);
    }

    public invokeResult = (resultCallback: (msg: any, senderId: CruxId | undefined) => any, errorCallback: (err: any) => any): void => {
        if (!this.secureCruxIdMessenger) {
            throw Error("RemoteKeyClient cannot listen with no selfMessenger");
        }
        console.log("hello");
        this.secureCruxIdMessenger.listen((msg: any, senderId: CruxId | undefined) => {
            console.log("hello dope");
            resultCallback(msg, senderId);
        }, (err: any) => {
            errorCallback(err);
            return;
        });
    }

    private generateMethodData(method: string, args: any[]) {
        return {
            args,
            invocationId: makeUUID4(),
            method,
        };
    }
}

export class RemoteKeyHost {
    private secureCruxIdMessenger: SecureCruxIdMessenger;
    private keyManager: IKeyManager;

    constructor(secureCruxIdMessenger: SecureCruxIdMessenger, keyManager: IKeyManager) {
        this.secureCruxIdMessenger = secureCruxIdMessenger;
        this.keyManager = keyManager;
    }

    public async sendInvocationResult(result: any, receiverId: CruxId) {
        if (!this.secureCruxIdMessenger) {
            throw Error("RemoteKeyClient cannot send with no selfMessenger");
        }
        const resultData = this.generateInvocationResponse(result);
        console.log(resultData);
        await this.secureCruxIdMessenger.send(resultData, receiverId);
    }

    public invocationListener = (resultCallback: (msg: any, senderId: CruxId | undefined) => any, errorCallback: (err: any) => any): void => {
        if (!this.secureCruxIdMessenger) {
            throw Error("RemoteKeyClient cannot listen with no selfMessenger");
        }
        this.secureCruxIdMessenger.listen((msg: any, senderId: CruxId | undefined) => {
            this.handleMessage(msg);
            resultCallback(msg, senderId);
        }, (err: any) => {
            errorCallback(err);
            return;
        });
    }

    public async handleMessage(message: any) {
        if (!VALID_METHODS.includes(message.method)) {
            throw new Error("Invalid key manager method");
        }
        if (!this.keyManager) {
            throw new Error("Key Manager not available");
        }
        let data;
        if (message.method === "signWebToken") {
            data = await this.keyManager.signWebToken(message.agrs[0]);
        } else if (message.method === "getPubKey") {
            data = await this.keyManager.getPubKey();
        }
        return {
            data,
            invocationId: message.invocationId,
        };
    }

    private generateInvocationResponse(result: any) {
        return {
            invocationId: result.invocationId,
            result,
        };
    }
}
