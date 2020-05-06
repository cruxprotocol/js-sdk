// @ts-ignore
// @ts-ignore

import {CruxId} from "../../packages";
import {ICruxGatewayTransport, IGatewayIdentityClaim, IGatewayProtocolHandler} from "../interfaces";

export enum EventBusEventNames {
    newMessage = "newMessage",
    error = "error",
}

export interface IGatewayPacket {
    metadata: IGatewayPacketMetadata;
    message: any;
}

export interface IGatewayPacketMetadata {
    packetCreatedAt: Date;
    protocol: string;
}

class GatewayPacketManager {
    private protocolHandler: IGatewayProtocolHandler;
    constructor(protocolHandler: IGatewayProtocolHandler, selfClaim?: IGatewayIdentityClaim) {
        this.protocolHandler = protocolHandler;
    }

    public createNewPacket(message: any): IGatewayPacket {
        this.protocolHandler.validateMessage(message);
        const metadata = this.makePacketMetadata();
        this.validateMetadata(metadata);
        return {
            message,
            metadata,
        };
    }
    public parse(packet: IGatewayPacket): IGatewayPacket {
        this.protocolHandler.validateMessage(packet.message);
        return {
            message: packet.message,
            metadata: packet.metadata,
        };
    }
    private makePacketMetadata(): IGatewayPacketMetadata {
        return {
            packetCreatedAt: new Date(),
            protocol: this.protocolHandler.getName(),
        };
    }
    private validateMetadata(metadata: IGatewayPacketMetadata) {
        // TODO: Validate Metadata
        return metadata;
    }
}

export class CruxGateway {

    private transport: ICruxGatewayTransport;
    private messageListener: (message: any) => void;
    private selfClaim?: IGatewayIdentityClaim;
    private packetManager: GatewayPacketManager;

    constructor(protocolHandler: IGatewayProtocolHandler, transport: ICruxGatewayTransport, selfClaim?: IGatewayIdentityClaim) {
        // const that = this;
        this.selfClaim = selfClaim;
        this.transport = transport;
        this.messageListener = (message) => undefined;
        this.packetManager = new GatewayPacketManager(protocolHandler, selfClaim);
    }

    public sendMessage(recipient: CruxId, message: any) {
        const packet = this.packetManager.createNewPacket(message);
        const eventBus = this.transport.getEventBus(recipient);
        const serializedPacket = JSON.stringify(packet);
        eventBus.send(serializedPacket);
    }

    public listen(messageListener: (metadata: any, message: any) => void) {
        if (!this.selfClaim) {
            throw Error("Cannot listen to a gateway with no selfClaim");
        }
        const eventBus = this.transport.getEventBus();
        eventBus.on(EventBusEventNames.newMessage, (data: string) => {
            const deserializedData = JSON.parse(data);
            const packet = this.packetManager.parse(deserializedData);
            messageListener(packet.metadata, packet.message);
        });
    }
}
