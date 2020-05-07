// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore

import {CruxId} from "../../packages";
import {IGatewayIdentityClaim, IGatewayProtocolHandler, IPubSubProvider } from "../interfaces";

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

export class GatewayEventBus {
    private registeredCallbacks: any;
    private recipient?: CruxId;
    private selfId?: CruxId;
    private pubsubProvider: IPubSubProvider;

    constructor(pubsubProvider: IPubSubProvider, recipient?: CruxId, selfId?: CruxId) {
        this.registeredCallbacks = {};
        this.pubsubProvider = pubsubProvider;
        if (!recipient && !selfId) {
            throw Error("Invalid state. One of recipient or selfId must be present");
        }

        if (selfId) {
            const selfTopic = "topic_" + selfId.toString();
            pubsubProvider.subscribe(selfTopic, new EventBusProxy(this, EventBusEventNames.newMessage).redirect);
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
        this.pubsubProvider.publish(recipientTopic, data);
    }

    public getRegisteredCallback(eventName: string) {
        return this.registeredCallbacks[eventName];
    }
}

export class CruxGateway {

    private pubsubProvider: IPubSubProvider;
    private messageListener: (message: any) => void;
    private selfClaim?: IGatewayIdentityClaim;
    private packetManager: GatewayPacketManager;

    constructor(pubsubProvider: IPubSubProvider, protocolHandler: IGatewayProtocolHandler, selfClaim?: IGatewayIdentityClaim) {
        // const that = this;
        this.selfClaim = selfClaim;
        this.pubsubProvider = pubsubProvider;
        this.messageListener = (message) => undefined;
        this.packetManager = new GatewayPacketManager(protocolHandler, selfClaim);
    }

    public sendMessage(recipient: CruxId, message: any) {
        const eventBus = new GatewayEventBus(this.pubsubProvider, recipient, this.selfClaim!.cruxId);
        const packet = this.packetManager.createNewPacket(message);
        const serializedPacket = JSON.stringify(packet);
        eventBus.send(serializedPacket);
    }

    public listen(messageListener: (metadata: any, message: any) => void) {
        if (!this.selfClaim) {
            throw Error("Cannot listen to a gateway with no selfClaim");
        }
        const eventBus = new GatewayEventBus(this.pubsubProvider, undefined, this.selfClaim!.cruxId);
        eventBus.on(EventBusEventNames.newMessage, (data: string) => {
            const deserializedData = JSON.parse(data);
            const packet = this.packetManager.parse(deserializedData);
            messageListener(packet.metadata, packet.message);
        });
    }
}
