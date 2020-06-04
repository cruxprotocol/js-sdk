import {makeUUID4} from "blockstack/lib";
import { createNanoEvents, DefaultEvents, Emitter } from "nanoevents";
import { CruxId } from "../../packages";
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
            // @ts-ignore
            await this.sendInvocationResult(data, CruxId.fromString(senderId!)); // getting senderId as string
        });
    }
    private async sendInvocationResult(result: any, receiverId: CruxId) {
        if (!this.cruxProtocolMessenger) {
            throw Error("RemoteKeyClient cannot send with no selfMessenger");
        }
        const resultData = this.generateInvocationResponse(result);
        console.log("RemoteKeyHost::Inside sendInvocationResult::resultData: ", resultData);
        await this.cruxProtocolMessenger.send({
            content: resultData,
            type: "KEY_MANAGER_RESPONSE",
        }, receiverId);
    }

    private async handleMessage(message: any) {
        if (!this.keyManager) {
            throw new Error("Key Manager not available");
        }
        let data;
        // @ts-ignore
        data = await this.keyManager[message.method](message.args[0]);
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
    public signWebToken = async (args: any) => {
        return this.makeRemoteMessageCall("signWebToken", [args]);
    }
    // @ts-ignore
    public getPubKey = async () => {
        return this.makeRemoteMessageCall("getPubKey");
    }
    // @ts-ignore
    public deriveSharedSecret = async (args: string) => {
        return this.makeRemoteMessageCall("deriveSharedSecret", [args]);
    }
    // @ts-ignore
    public decryptMessage = async (args: string) => {
        return this.makeRemoteMessageCall("decryptMessage", [args]);
    }

    private makeRemoteMessageCall = async (method: string, args: any = []) => {
        console.log("makeRemoteMessageCall::", method, args);
        const invocationId = await this.remoteKeyClient.invoke(method, args);
        console.log("RemoteKeyManager::makeRemoteMessageCall::invokationId: ", invocationId);
        return new Promise(async (resolve, reject) => {
            this.remoteKeyClient.listenToInvocation(invocationId, (msg, senderId) => {
                console.log("RemoteKeyManager::deriveSharedSecret::msg: ", msg);
                resolve(msg.result.data);
            }, (err) => {
                reject(err);
            });
        });
    }
}
