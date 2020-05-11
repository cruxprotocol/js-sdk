import {StrongPubSubClient} from "../../infrastructure/implementations";
import {CruxId} from "../../packages";
import {CruxUser} from "../entities";

import {ICruxIdClaim, ICruxUserRepository, IKeyManager} from "../interfaces";
import {
    ICruxIdCertificate,
    IPubSubClient,
    IPubSubClientFactory,
    ISecurePacket,
} from "../interfaces";

export class CertificateManager {
    public static make = (idClaim: ICruxIdClaim): ICruxIdCertificate => {
        return {
            claim: idClaim.cruxId.toString(),
            proof: "PROOF",
        };
    }
    public static verify = (certificate: ICruxIdCertificate, publicKey: string) => {
        return true;
    }
}

export class EncryptionManager {
    // Use ECIES to encrypt & decrypt
    public static encrypt = (content: string, pubKeyOfRecipient: string): string => {
        return content;
    }
    public static decrypt = (encryptedContent: string, keyManager: IKeyManager): string => {
        return encryptedContent;
    }
}

export enum EventBusEventNames {
    newMessage = "newMessage",
    error = "error",
}

export class SecureCruxIdMessenger {
    private selfIdClaim: ICruxIdClaim;
    private cruxUserRepo: ICruxUserRepository;
    private pubsubClientFactory: IPubSubClientFactory;
    private selfMessenger: CruxIdMessenger;
    constructor(cruxUserRepo: ICruxUserRepository, pubsubClientFactory: IPubSubClientFactory, selfIdClaim: ICruxIdClaim) {
        this.cruxUserRepo = cruxUserRepo;
        this.selfIdClaim = selfIdClaim;
        this.pubsubClientFactory = pubsubClientFactory;
        const pubSubClient = this.pubsubClientFactory.getSelfClient(selfIdClaim);
        this.selfMessenger = new CruxIdMessenger(pubSubClient, this.selfIdClaim.cruxId);
        // TODO: Do we need to validate selfIdClaim?
    }
    public send = async (data: any, recipientCruxId: CruxId): Promise<void> => {
        const recipientCruxUser: CruxUser | undefined = await this.cruxUserRepo.getByCruxId(recipientCruxId);
        if (!recipientCruxUser) {
            throw Error("No Such CRUX User Found");
        }
        const certificate = CertificateManager.make(this.selfIdClaim);
        const securePacket: ISecurePacket = {
            certificate,
            data,
        };
        const serializedSecurePacket = JSON.stringify(securePacket);
        const encryptedSecurePacket = EncryptionManager.encrypt(serializedSecurePacket, recipientCruxUser.publicKey!);
        const pubSubClient = this.pubsubClientFactory.getRecipientClient(this.selfIdClaim.cruxId, recipientCruxId);
        const messenger = new CruxIdMessenger(pubSubClient, this.selfIdClaim.cruxId);
        messenger.send(encryptedSecurePacket, recipientCruxId);
    }

    public listen = (newMessageCallback: (msg: any) => void): void => {
        this.selfMessenger.on(EventBusEventNames.newMessage, async (encryptedString: string) => {
            const serializedSecurePacket: string = EncryptionManager.decrypt(encryptedString, this.selfIdClaim.keyManager);
            const securePacket: ISecurePacket = JSON.parse(serializedSecurePacket);
            const senderUser: CruxUser | undefined = await this.cruxUserRepo.getByCruxId(CruxId.fromString(securePacket.certificate.claim));
            if (!senderUser) {
                throw Error("Sender user does not exist");
            }
            const isVerified = CertificateManager.verify(securePacket.certificate, senderUser.publicKey!);
            if (!isVerified) {
                throw Error("Could not validate");
            }
            newMessageCallback(securePacket.data);
        });
    }
}

export class CruxIdMessenger {
    public selfId: CruxId;
    private registeredCallbacks: any;
    private pubsubClient: IPubSubClient;

    constructor(pubsubClient: IPubSubClient, selfId: CruxId) {
        this.registeredCallbacks = {};
        this.pubsubClient = pubsubClient;
        const selfTopic = "topic_" + selfId.toString();
        pubsubClient.subscribe(selfTopic, new MessengerEventProxy(this, EventBusEventNames.newMessage).redirect);
        this.selfId = selfId;
    }

    public on(eventName: EventBusEventNames, callback: (msg: string) => void): void {
        this.registeredCallbacks[eventName] = callback;
    }

    public send(data: string, recipientId: CruxId): void {
        const recipientTopic = "topic_" + recipientId.toString();
        this.pubsubClient.publish(recipientTopic, data);
    }

    public getRegisteredCallback(eventName: string) {
        return this.registeredCallbacks[eventName];
    }
}

export class MessengerEventProxy {
    private eventName: EventBusEventNames;
    private messenger: CruxIdMessenger;

    constructor(eventBus: CruxIdMessenger, eventName: EventBusEventNames) {
        this.eventName = eventName;
        this.messenger = eventBus;
    }

    public redirect = (msg: string) => {
        const callbackForEventName = this.messenger.getRegisteredCallback(this.eventName);
        if (!callbackForEventName) {
            console.log("No Registered callback. Event wasted");
        } else {
            callbackForEventName(msg);
        }
    }
}
