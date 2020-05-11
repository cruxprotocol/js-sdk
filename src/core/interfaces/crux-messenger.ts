import {CruxId} from "../../packages";
import {IKeyManager} from "./key-manager";

export interface ICruxIdClaim {
    cruxId: CruxId;
    keyManager: IKeyManager;
}

export interface IPubSubClient {
    subscribe: (topic: string, callback: any) => void;
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

export interface IPubSubClientFactory {
    getRecipientClient: (selfCruxId: CruxId, recipientCruxId: CruxId) => IPubSubClient;
    getSelfClient: (idClaim: ICruxIdClaim) => IPubSubClient;
}
