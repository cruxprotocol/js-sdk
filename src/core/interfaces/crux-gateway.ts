import {CruxId} from "../../packages";
import {CruxGateway} from "../entities";
import {EventBusEventNames} from "../entities";
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
    get: (protocol: string, recipient: CruxId, selfClaim?: IGatewayIdentityClaim) => CruxGateway;
}

export interface IGatewayEventBus {
    on(eventName: EventBusEventNames, callback: any): void;

    send(data: any): void;

    getRegisteredCallback(eventName: EventBusEventNames): any;
}

export interface ICruxGatewayTransport {
    connect(recipient?: CruxId): IGatewayEventBus;
}
