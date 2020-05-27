// @ts-ignore
import {JoiObject} from "joi";
import {CruxId} from "../../packages";
import {IKeyManager} from "./key-manager";
export interface ICruxIdClaim {
    cruxId: CruxId;
    keyManager: IKeyManager;
}

export interface IPubSubClient {
    subscribe: (topic: string, callback: any) => void;
    onError: (callback: any) => void;
    publish: (topic: string, data: any) => void;
}

export interface ICruxIdCertificate {
    claim: string;
    proof: string;
}

export interface ISecurePacket {
    certificate?: ICruxIdCertificate;
    data: any;
}
export interface IProtocolMessage {
    type: string;
    content: any;
}

export interface IMessageSchema {
    messageType: string;
    schema: JoiObject;
}

export interface IPubSubClientFactory {
    getClient: (from: CruxId, keyManager: IKeyManager, to?: CruxId) => IPubSubClient;
}
