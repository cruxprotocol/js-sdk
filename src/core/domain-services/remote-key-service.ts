import {makeUUID4} from "blockstack/lib";
import { createNanoEvents, DefaultEvents, Emitter } from "nanoevents";
import { CruxId } from "src/packages";
import { IKeyManager } from "../interfaces";
import { CruxProtocolMessenger, SecureCruxNetwork } from "./crux-messenger";

const VALID_METHODS = ["signWebToken", "getPubKey", "deriveSharedSecret", "decryptMessage"];

export class RemoteKeyClient {
    private cruxProtocolMessenger: CruxProtocolMessenger;
    private remoteUserId: CruxId;
    private emitter: Emitter<DefaultEvents>;

    constructor(cruxProtocolMessenger: CruxProtocolMessenger, remoteUserId: CruxId) {
        this.cruxProtocolMessenger = cruxProtocolMessenger;
        this.remoteUserId = remoteUserId;
        this.emitter = createNanoEvents();
    }

    public async initialize() {
        this.cruxProtocolMessenger.on("KEY_MANAGER_RESPONSE", async (msg: any, senderId: CruxId | undefined) => {
            console.log("Inside RemoteKeyClient::initialize::Msg, senderId: ", msg, senderId);
            this.emitter.emit(msg.invocationId, msg, senderId);
        });
    }

    public async invoke(method: string, args: any[]) {
        console.log("RemoteKeyClient::Inside Invoke");
        if (!this.cruxProtocolMessenger) {
            throw Error("RemoteKeyClient cannot send with no secureCruxNetwork");
        }
        const methodData = this.generateMethodData(method, args);
        console.log("RemoteKeyClient::Inside Invoke, RemoteUserId, MethodData", this.remoteUserId, methodData);
        // @ts-ignore
        await this.cruxProtocolMessenger.send({
            content: methodData,
            type: "KEY_MANAGER_REQUEST",
        }, this.remoteUserId);
        return methodData.invocationId;
    }

    public listenToInvocation = (invocationId: string, resultCallback: (msg: any, senderId: CruxId | undefined) => any, errorCallback: (err: any) => any): void => {
        if (!this.cruxProtocolMessenger) {
            throw Error("RemoteKeyClient cannot listen with no secureCruxNetwork");
        }
        console.log("RemoteKeyClient::ListenToInvocation::invocationId", invocationId);
        this.emitter.on(invocationId, resultCallback);
        this.emitter.on("error", errorCallback);
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
    private cruxProtocolMessenger: CruxProtocolMessenger;
    private keyManager: IKeyManager;

    constructor(cruxProtocolMessenger: CruxProtocolMessenger, keyManager: IKeyManager) {
        this.keyManager = keyManager;
        this.cruxProtocolMessenger = cruxProtocolMessenger;
    }

    public async initialize() {
        this.cruxProtocolMessenger.on("KEY_MANAGER_REQUEST", async (msg: any, senderId: CruxId | undefined) => {
            console.log("Inside RemoteKeyHost::in::Msg, senderId: ", msg, senderId);
            const data = await this.handleMessage(msg);
            console.log("Inside RemoteKeyHost::initialize::Data(handleMessage): ", data);
            this.sendInvocationResult(data, senderId!);
        });
    }
    private async sendInvocationResult(result: any, receiverId: CruxId) {
        if (!this.cruxProtocolMessenger) {
            throw Error("RemoteKeyClient cannot send with no selfMessenger");
        }
        const resultData = this.generateInvocationResponse(result);
        console.log("RemoteKeyHost::Inside sendInvocationResult::resultData: ", resultData);
        // @ts-ignore
        await this.cruxProtocolMessenger.send({
            content: resultData,
            type: "KEY_MANAGER_RESPONSE",
        }, receiverId);
    }

    private async handleMessage(message: any) {
        if (!VALID_METHODS.includes(message.method)) {
            throw new Error("Invalid key manager method");
        }
        if (!this.keyManager) {
            throw new Error("Key Manager not available");
        }
        let data;
        if (message.method === "signWebToken") {
            console.log("HandleMessage entrance:signWebToken");
            data = await this.keyManager.signWebToken(message.args[0]);
            console.log("HandleMessage exit:signWebToken", data);
        } else if (message.method === "getPubKey") {
            console.log("HandleMessage entrance:getPubKey");
            data = await this.keyManager.getPubKey();
            console.log("HandleMessage exit:getPubKey", data);
        } else if (message.method === "deriveSharedSecret") {
            console.log("HandleMessage entrance:deriveSharedSecret");
            // @ts-ignore
            data = await this.keyManager.deriveSharedSecret(message.args[0]);
            console.log("HandleMessage exit:deriveSharedSecret", data);
        } else if (message.method === "decryptMessage") {
            console.log("HandleMessage entrance:decryptMessage");
            // @ts-ignore
            data = await this.keyManager.decryptMessage(message.args[0]);
            console.log("HandleMessage exit:decryptMessage", data);
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

export class RemoteKeyManager implements IKeyManager {
    private remoteKeyClient: RemoteKeyClient;
    private remoteUserId: CruxId;

    constructor(cruxProtocolMessenger: CruxProtocolMessenger, remoteUserId: CruxId) {
        this.remoteKeyClient = new RemoteKeyClient(cruxProtocolMessenger, remoteUserId);
        this.remoteUserId = remoteUserId;
    }

    public async initialize() {
        await this.remoteKeyClient.initialize();
    }
    // @ts-ignore
    public signWebToken = async (token: any) => {
        return new Promise(async (resolve, reject) => {
            const invocationId = await this.remoteKeyClient.invoke("signWebToken", [token]);
            console.log("RemoteKeyManager::signWebToken::invokationId: ", invocationId);
            this.remoteKeyClient.listenToInvocation(invocationId, (msg, senderId) => {
                console.log("RemoteKeyManager::signWebToken::msg: ", msg);
                resolve(msg.result.data);
            }, (err) => {
                reject(err);
            });
        });
    }
    // @ts-ignore
    public getPubKey = async () => {
        return new Promise(async (resolve, reject) => {
            const invocationId = await this.remoteKeyClient.invoke("getPubKey", []);
            console.log("RemoteKeyManager::getPubKey::invokationId: ", invocationId);
            this.remoteKeyClient.listenToInvocation(invocationId, (msg, senderId) => {
                console.log("RemoteKeyManager::getPubKey::msg: ", msg);
                resolve(msg.result.data);
            }, (err) => {
                reject(err);
            });
        });
    }
    // @ts-ignore
    public deriveSharedSecret = async (publicKey: string) => {
        const invocationId = await this.remoteKeyClient.invoke("deriveSharedSecret", [publicKey]);
        console.log("RemoteKeyManager::deriveSharedSecret::invokationId: ", invocationId);
        return new Promise(async (resolve, reject) => {
            this.remoteKeyClient.listenToInvocation(invocationId, (msg, senderId) => {
                console.log("RemoteKeyManager::deriveSharedSecret::msg: ", msg);
                resolve(msg.result.data);
            }, (err) => {
                reject(err);
            });
        });
    }
    // @ts-ignore
    public decryptMessage = async (encryptedMessage: string) => {
        console.log("RemoteKeyManager::decryptMessage::entry: encryptedMessage: ", encryptedMessage);
        const invocationId = await this.remoteKeyClient.invoke("decryptMessage", [encryptedMessage]);
        console.log("RemoteKeyManager::decryptMessage::invokationId: ", invocationId);
        return new Promise(async (resolve, reject) => {
            this.remoteKeyClient.listenToInvocation(invocationId, (msg, senderId) => {
                console.log("RemoteKeyManager::decryptMessage::msg: ", msg);
                resolve(msg.result.data);
            }, (err) => {
                reject(err);
            });
        });
    }
}
