// @ts-ignore
import {JoiObject} from "joi";
import {CruxId} from "../../packages";
import {IKeyManager} from "./key-manager";
export interface ICruxIdClaim {
    cruxId: CruxId;
    keyManager: IKeyManager;
}

export interface IPubSubClient {
    subscribe: (topic: string, callback: any, errorCallback: any) => void;
    publish: (topic: string, data: any) => void;
}

export interface ICruxIdCertificate {
    claim: string;
    proof: string;
}

export interface ISecurePacket {
    certificate: ICruxIdCertificate;
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
    getRecipientClient: (selfCruxId: CruxId, recipientCruxId: CruxId) => IPubSubClient;
    getSelfClient: (idClaim: ICruxIdClaim) => IPubSubClient;
}
