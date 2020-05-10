import {decodeToken, TokenSigner, TokenVerifier} from "jsontokens";
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
        const privateKey = "12381ab829318742938647283cd462738462873642ef34abefcd123501827193"; // foo@123
        const payload = {
            messageId,
        };
        const signedProof = new TokenSigner("ES256K", privateKey).sign(payload);
        return {
                claim: idClaim.cruxId.toString(),
                messageId,
                proof: signedProof,
        };
    }
    public static verify = (idClaim: any, certificate: IGatewayIdentityCertificate) => {
        try {
            if (!idClaim || !certificate.proof || !certificate.messageId) {
                return false;
            }
            const proof: any = decodeToken(certificate.proof).payload;
            const publicKey = idClaim.keyManager.publicKey;
            const verified = new TokenVerifier("ES256K", publicKey).verify(certificate.proof);
            // tslint:disable-next-line: tsr-detect-possible-timing-attacks
            if (idClaim.cruxId.toString() === certificate.claim && proof.messageId === certificate.messageId && verified) {
                return true;
            }
            return false;
        } catch (err) {
            return false;
        }
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
        const messageId = "123e4567-e89b-12d3-a456-426614174000";
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
