import {CruxId} from "../../packages";
import {CruxGateway} from "../entities";
import {IKeyManager} from "./key-manager";

export interface IGatewayIdentityClaim {
    cruxId: CruxId;
    keyManager: IKeyManager;
}

export interface IGatewayProtocolHandler {
    getName(): string;

    validateMessage(gatewayMessage: any): boolean;
}

export interface ICruxGatewayRepository {
    openGateway: (protocol: string, selfClaim?: IGatewayIdentityClaim) => CruxGateway;
}

export interface IPubSubProvider {
    subscribe: (topic: string, callback: any) => void;
    publish: (topic: string, data: any) => void;
}
