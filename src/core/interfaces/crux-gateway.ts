import {CruxId} from "../../packages";
import {CruxGateway} from "../entities";
import {IKeyManager} from "./key-manager";

/**
 * Used to assert ownership of a CruxID
 */
export interface IGatewayIdentityClaim {
    cruxId: CruxId;
    keyManager: IKeyManager;
}

/**
 * Asserts rules to a message's content
 */
export interface IGatewayProtocolHandler {
    getName(): string;
    validateMessage(gatewayMessage: any): boolean;
}

export interface ICruxIdPubSubChannel {
    cruxId: CruxId;
    pubsubClient: IPubSubClient;
    keyManager?: IKeyManager;
}

export interface IGatewayRepositoryGetParams {
    protocol?: string;
    selfIdClaim?: IGatewayIdentityClaim;
    receiverId?: CruxId;
}
export interface ICruxGatewayRepository {
    get: (params: IGatewayRepositoryGetParams) => CruxGateway;
}

export interface IPubSubClient {
    subscribe: (topic: string, callback: any) => void;
    publish: (topic: string, data: any) => void;
}

export interface IGatewayPacket {
    metadata: IGatewayPacketMetadata;
    message: any;
}

export interface IGatewayPacketMetadata {
    messageId: string;
    packetCreatedAt: Date;
    protocol: string;
    senderCertificate?: IGatewayIdentityCertificate;
}

export interface IGatewayIdentityCertificate {
    claim: string;
    proof: string;
}

export interface ICruxGatewayParams {
    protocolHandler: IGatewayProtocolHandler;
    selfChannel?: ICruxIdPubSubChannel;
    recipientChannel?: ICruxIdPubSubChannel;
}
