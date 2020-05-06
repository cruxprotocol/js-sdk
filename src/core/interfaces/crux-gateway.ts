import {CruxId} from "../../packages";
import {CruxGateway} from "../entities";
import {EventSocketEventNames} from "../entities";
import {IKeyManager} from "./key-manager";

export interface IGatewayMessageSender {
    cruxId?: CruxId;
    keyManager?: IKeyManager;
}

export interface IGatewayProtocolHandler {
    getName(): string;

    validateMessage(gatewayMessage: any): boolean;
}

export interface ICruxGatewayRepository {
    get: (protocol: string, recipient: CruxId, sender?: IGatewayMessageSender) => CruxGateway;
}

export interface IGatewayEventSocket {
    on(eventName: EventSocketEventNames, callback: any): void;

    send(data: any): void;

    getRegisteredCallback(eventName: EventSocketEventNames): any;
}

export interface ICruxGatewayTransport {
    connect(recipient: CruxId): IGatewayEventSocket;
}
