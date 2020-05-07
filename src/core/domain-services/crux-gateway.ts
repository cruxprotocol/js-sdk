import {CruxId} from "../../packages";

import {
    IGatewayIdentityCertificate,
    IGatewayIdentityClaim, IGatewayPacket, IGatewayPacketMetadata,
    IGatewayProtocolHandler,
    IPubSubClient,
} from "../interfaces";

const getCertificate = (idClaim: IGatewayIdentityClaim): IGatewayIdentityCertificate => {
    return {
        claim: idClaim.cruxId.toString(),
        proof: "PROOF",
    };
};

export class GatewayPacketManager {
    private protocolHandler: IGatewayProtocolHandler;
    private selfClaim: IGatewayIdentityClaim | undefined;

    constructor(protocolHandler: IGatewayProtocolHandler, selfClaim?: IGatewayIdentityClaim) {
        this.protocolHandler = protocolHandler;
        this.selfClaim = selfClaim;
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
        let senderCertificate: IGatewayIdentityCertificate | undefined;
        if (this.selfClaim) {
            senderCertificate = getCertificate(this.selfClaim);
        }
        return {
            packetCreatedAt: new Date(),
            protocol: this.protocolHandler.getName(),
            senderCertificate,
        };
    }

    private validateMetadata(metadata: IGatewayPacketMetadata) {
        // TODO: Validate Metadata
    }
}

export enum EventBusEventNames {
    newMessage = "newMessage",
    error = "error",
}

export class GatewayEventBus {
    private registeredCallbacks: any;
    private recipient?: CruxId;
    private selfId?: CruxId;
    private pubsubClient: IPubSubClient;

    constructor(pubsubClient: IPubSubClient, recipient?: CruxId, selfId?: CruxId) {
        this.registeredCallbacks = {};
        this.pubsubClient = pubsubClient;
        if (!recipient && !selfId) {
            throw Error("Invalid state. At least one of recipient or selfId must be present");
        }

        if (selfId) {
            const selfTopic = "topic_" + selfId.toString();
            pubsubClient.subscribe(selfTopic, new EventBusProxy(this, EventBusEventNames.newMessage).redirect);
        }
        this.selfId = selfId;
        this.recipient = recipient;
    }

    public on(eventName: EventBusEventNames, callback: (msg: string) => void): void {
        if (!this.selfId) {
            throw Error("Cannot receive messages as this bus has no selfId");
        }
        this.registeredCallbacks[eventName] = callback;
    }

    public send(data: string): void {
        if (!this.recipient) {
            throw Error("Cannot send in a bus with no recipient");
        }
        const recipientTopic = "topic_" + this.recipient.toString();
        this.pubsubClient.publish(recipientTopic, data);
    }

    public getRegisteredCallback(eventName: string) {
        return this.registeredCallbacks[eventName];
    }
}

export class EventBusProxy {
    private eventName: EventBusEventNames;
    private eventBus: GatewayEventBus;

    constructor(eventBus: GatewayEventBus, eventName: EventBusEventNames) {
        this.eventName = eventName;
        this.eventBus = eventBus;
    }

    public redirect = (msg: string) => {
        const callbackForEventName = this.eventBus.getRegisteredCallback(this.eventName);
        if (!callbackForEventName) {
            console.log("No Registered callback. Event wasted");
        } else {
            callbackForEventName(msg);
        }
    }
}
