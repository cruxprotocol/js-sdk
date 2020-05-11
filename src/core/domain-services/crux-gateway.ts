import {decodeToken, TokenVerifier} from "jsontokens";
import {CruxId} from "../../packages";

import {
    IGatewayIdentityCertificate,
    IGatewayIdentityClaim, IGatewayPacket, IGatewayPacketMetadata,
    IGatewayProtocolHandler,
    IKeyManager,
    IPubSubClient,
} from "../interfaces";

export class CertificateManager {
    public static make = async (idClaim: IGatewayIdentityClaim, messageId: string): Promise<IGatewayIdentityCertificate> => {
        const payload = {
            messageId,
        };
        const signedProof = await idClaim.keyManager.signWebToken(payload);
        return {
                claim: idClaim.cruxId.toString(),
                proof: signedProof,
        };
    }
    public static verify = (senderPubKey: any, certificate: IGatewayIdentityCertificate) => {
        const proof: any = decodeToken(certificate.proof).payload;
        const verified = new TokenVerifier("ES256K", senderPubKey).verify(certificate.proof);
        if (proof && proof.messageId && verified) {
            return proof.messageId;
        }
        throw Error("Could not verify sender certificate");
    }
}

export class GatewayPacketManager {
    private protocolHandler: IGatewayProtocolHandler;
    private selfClaim: IGatewayIdentityClaim | undefined;
    private messageId: string;

    constructor(messageId: string, protocolHandler: IGatewayProtocolHandler, selfClaim?: IGatewayIdentityClaim) {
        this.protocolHandler = protocolHandler;
        this.selfClaim = selfClaim;
        this.messageId = messageId;
    }

    public async createNewPacket(message: any): Promise<IGatewayPacket> {
        this.protocolHandler.validateMessage(message);
        const metadata = await this.makePacketMetadata();
        this.validateMetadata(metadata);
        return {
            message,
            metadata,
        };
    }

    public parse(packet: IGatewayPacket): IGatewayPacket {
        this.protocolHandler.validateMessage(packet.message);
        if (packet.metadata.senderCertificate) {
            if (!CertificateManager.verify(this.selfClaim, packet.metadata.senderCertificate)) {
                throw Error("Count not verify sender certificate");
            }
        }
        return {
            message: packet.message,
            metadata: packet.metadata,
        };
    }

    private async makePacketMetadata(): Promise<IGatewayPacketMetadata> {
        const messageId = this.messageId;
        let senderCertificate: IGatewayIdentityCertificate | undefined;
        if (this.selfClaim) {
            senderCertificate = await CertificateManager.make(this.selfClaim, messageId);
        }
        return {
            messageId,
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
