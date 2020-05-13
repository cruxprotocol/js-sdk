import {decodeToken, TokenVerifier} from "jsontokens";
import {BufferJSONSerializer, CruxId} from "../../packages";
import { ECIESEncryption } from "../../packages/encryption";
import {CruxUser} from "../entities";

import {
    ICruxIdCertificate,
    ICruxIdClaim,
    ICruxUserRepository,
    IKeyManager,
    IMessageSchema,
    IProtocolMessage,
    IPubSubClient,
    IPubSubClientFactory,
    ISecurePacket,
} from "../interfaces";

export class CertificateManager {
    public static make = async (idClaim: ICruxIdClaim): Promise<ICruxIdCertificate> => {
        const payload = idClaim.cruxId.toString();
        const signedProof = await idClaim.keyManager.signWebToken(payload);
        return {
                claim: idClaim.cruxId.toString(),
                proof: signedProof,
        };
    }
    public static verify = (certificate: ICruxIdCertificate, senderPubKey: any) => {
        const proof: any = decodeToken(certificate.proof).payload;
        const verified = new TokenVerifier("ES256K", senderPubKey).verify(certificate.proof);
        if (proof && proof === certificate.claim && verified) {
            return true;
        }
        return false;
    }
}

export class EncryptionManager {
    // Use ECIES to encrypt & decrypt
    public static encrypt = async (content: string, pubKeyOfRecipient: string): Promise<string> => {
        const toEncrypt = Buffer.from(content, "utf8");
        const encrypted = await ECIESEncryption.encrypt(toEncrypt, pubKeyOfRecipient);
        return BufferJSONSerializer.bufferObjectToJSONString(encrypted);
    }
    public static decrypt = async (encryptedContent: string, keyManager: IKeyManager): Promise<string> => {
        try {
            const decryptedContent = await keyManager.decryptMessage!(encryptedContent);
            return decryptedContent;
        } catch (e) {
            if (e.message === "Bad MAC") {
                throw new Error("Decryption failed");
            }
            throw e;
        }
    }
}

export enum EventBusEventNames {
    newMessage = "newMessage",
    error = "error",
}

export class CruxConnectProtocolMessenger {
    private secureMessenger: SecureCruxIdMessenger;
    private schemaByMessageType: any;

    constructor(secureMessenger: SecureCruxIdMessenger, protocol: IMessageSchema[]) {
        this.secureMessenger = secureMessenger;
        this.schemaByMessageType = protocol.reduce((newObj, x) => Object.assign(newObj, {[x.messageType]: x.schema}), {});
    }
    public send = async (message: IProtocolMessage, recipientCruxId: CruxId): Promise<void> => {
        this.validateMessage(message);
        this.secureMessenger.send(message, recipientCruxId);
    }

    public listen = (newMessageCallback: (msg: any) => void): void => {
        this.secureMessenger.listen((msg: IProtocolMessage) => {
            this.validateMessage(msg);
            newMessageCallback(msg);
        },
        (err) => {
            throw err;
        });
    }
    public validateMessage = (message: IProtocolMessage): void => {
        const schema = this.getSchema(message.type);
        this.validateContent(message.content, schema);
    }

    private getSchema = (messageType: string): any => {
        const schema = this.schemaByMessageType[messageType];
        if (!schema) {
            throw Error("Did not recognize message type");
        }
    }
    private validateContent = (content: any, schema: any): void => {
        try {
            // @ts-ignore
            schema.validate(content);
        } catch (e) {
            throw Error("Message content does not match schema for");
        }
    }
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
        const certificate = await CertificateManager.make(this.selfIdClaim);
        const securePacket: ISecurePacket = {
            certificate,
            data,
        };
        const serializedSecurePacket = JSON.stringify(securePacket);
        const encryptedSecurePacket = await EncryptionManager.encrypt(serializedSecurePacket, recipientCruxUser.publicKey!);
        const pubSubClient = this.pubsubClientFactory.getRecipientClient(this.selfIdClaim.cruxId, recipientCruxId);
        const messenger = new CruxIdMessenger(pubSubClient, this.selfIdClaim.cruxId);
        messenger.send(encryptedSecurePacket, recipientCruxId);
    }

    public listen = (newMessageCallback: (msg: any) => any, errorCallback: (err: any) => any): void => {
            this.selfMessenger.on(EventBusEventNames.newMessage, async (encryptedString: string) => {
                try {
                    const serializedSecurePacket: string = await EncryptionManager.decrypt(encryptedString, this.selfIdClaim.keyManager);
                    const securePacket: ISecurePacket = JSON.parse(serializedSecurePacket);
                    const senderUser: CruxUser | undefined = await this.cruxUserRepo.getByCruxId(CruxId.fromString(securePacket.certificate.claim));
                    if (!senderUser) {
                        errorCallback(new Error("Sender user does not exist"));
                        return;
                    }
                    const isVerified = CertificateManager.verify(securePacket.certificate, senderUser.publicKey!);
                    if (!isVerified) {
                        errorCallback(new Error("Could not validate identity"));
                        return;
                    }
                    newMessageCallback(securePacket.data);
                } catch (error) {
                    errorCallback(error);
                    return;
                }
            });
            this.selfMessenger.on(EventBusEventNames.error, async () => {
                errorCallback(new Error("Error Received while processing event"));
                return;
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
        pubsubClient.subscribe(selfTopic, new MessengerEventProxy(this, EventBusEventNames.newMessage).redirect, new MessengerEventProxy(this, EventBusEventNames.error).redirect);
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
