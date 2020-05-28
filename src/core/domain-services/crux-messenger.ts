import {makeUUID4} from "blockstack/lib";
import {decodeToken, TokenVerifier} from "jsontokens";
import {createNanoEvents, Emitter} from "nanoevents";
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
        console.log("CertificateManager::make:claim: ",payload);
        const signedProof = await idClaim.keyManager.signWebToken(payload);
        return {
                claim: idClaim.cruxId.toString(),
                proof: signedProof,
        };
    }
    public static verify = (certificate: ICruxIdCertificate, senderPubKey: any) => {
        const proof: any = decodeToken(certificate.proof).payload;
        const verified = new TokenVerifier("ES256K", senderPubKey).verify(certificate.proof);
        console.log("CertificateManager::verify:: verified, claim, proof", verified, certificate.claim, proof);
        if (proof && proof === certificate.claim && verified) {
            return true;
        }
        return false;
    }
}

export class EncryptionManager {
    // Use ECIES to encrypt & decrypt
    public static encrypt = async (content: string, pubKeyOfRecipient: string): Promise<string> => {
        // TODO: Handle encoding properly (UTF-8 might not work in all scenarios)
        const toEncrypt = Buffer.from(content, "utf8");
        const encrypted = await ECIESEncryption.encrypt(toEncrypt, pubKeyOfRecipient);
        return BufferJSONSerializer.bufferObjectToJSONString(encrypted);
    }
    public static decrypt = async (encryptedContent: string, keyManager: IKeyManager): Promise<string> => {
        try {
            console.log("EncryptionManager::decrypt::keymanager, encryptionContent: ", keyManager, encryptedContent);
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
    private errorHandler: (error: any) => void;
    private messageHandlerByType: {[type: string]: (data: any, senderId?: CruxId) => void};

    constructor(secureMessenger: SecureCruxIdMessenger, protocol: IMessageSchema[]) {
        this.secureMessenger = secureMessenger;
        this.schemaByMessageType = protocol.reduce((newObj, x) => Object.assign(newObj, {[x.messageType]: x.schema}), {});
        // tslint:disable-next-line:no-empty
        this.errorHandler = (error) => {};
        this.messageHandlerByType = {};
        this.secureMessenger.listen((msg: IProtocolMessage, senderId?: CruxId) => {
            this.handleNewMessage(msg, senderId);
        }, (e: Error) => {
            this.handleNewError(e);
        });
    }
    public send = async (message: IProtocolMessage, recipientCruxId: CruxId): Promise<void> => {
        this.validateMessage(message);
        this.secureMessenger.send(message, recipientCruxId);
    }
    public on = (messageType: string, callback: (data: any, senderId?: CruxId) => void) => {
        this.getSchema(messageType);
        this.messageHandlerByType[messageType] = callback;
    }
    public validateMessage = (message: IProtocolMessage): void => {
        const schema = this.getSchema(message.type);
        this.validateContent(message.content, schema);
    }

    private handleNewMessage = (message: IProtocolMessage, senderId?: CruxId) => {
        try {
            this.validateMessage(message);
        } catch (e) {
            this.handleNewError(e);
            return;
        }
        const callback = this.messageHandlerByType[message.type];
        if (callback) {
            callback(message.content, senderId);
        }

    }
    private handleNewError = (error: any) => {
        this.errorHandler(error);
    }

    private getSchema = (messageType: string): any => {
        const schema = this.schemaByMessageType[messageType];
        if (!schema) {
            throw Error("Did not recognize message type");
        }
        return schema;
    }
    private validateContent = (content: any, schema: any): void => {
        // @ts-ignore
        const result = schema.validate(content);
        if (result.error) {
            throw new Error("Could not validate message as per schema- " + result.error.message);
        }
    }
}

export class SecureCruxIdMessenger {
    private selfIdClaim?: ICruxIdClaim;
    private cruxUserRepo: ICruxUserRepository;
    private pubsubClientFactory: IPubSubClientFactory;
    private selfMessenger?: CruxIdMessenger;
    constructor(cruxUserRepo: ICruxUserRepository, pubsubClientFactory: IPubSubClientFactory, selfIdClaim?: ICruxIdClaim) {
        this.cruxUserRepo = cruxUserRepo;
        this.selfIdClaim = selfIdClaim;
        this.pubsubClientFactory = pubsubClientFactory;
        const pubSubClient = selfIdClaim ? this.pubsubClientFactory.getSelfClient(selfIdClaim) : undefined;
        this.selfMessenger = selfIdClaim && pubSubClient ? new CruxIdMessenger(pubSubClient, selfIdClaim.cruxId) : undefined;
        // TODO: Do we need to validate selfIdClaim?
    }
    public send = async (data: any, recipientCruxId: CruxId): Promise<void> => {
        console.log("SecureCruxIdMessenger::send::entry");
        const recipientCruxUser: CruxUser | undefined = await this.cruxUserRepo.getByCruxId(recipientCruxId);
        if (!recipientCruxUser) {
            throw Error("No Such CRUX User Found");
        }
        console.log("SecureCruxIdMessenger::send::data: ", data);
        const certificate = this.selfIdClaim ? await CertificateManager.make(this.selfIdClaim) : undefined;
        const securePacket: ISecurePacket = {
            certificate,
            data,
        };
        const serializedSecurePacket = JSON.stringify(securePacket);
        const encryptedSecurePacket = await EncryptionManager.encrypt(serializedSecurePacket, recipientCruxUser.publicKey!);
        const pubSubClient = this.pubsubClientFactory.getRecipientClient(recipientCruxId, this.selfIdClaim ? this.selfIdClaim.cruxId : undefined);
        const messenger = new CruxIdMessenger(pubSubClient, this.selfIdClaim ? this.selfIdClaim.cruxId : undefined);
        await messenger.send(encryptedSecurePacket, recipientCruxId);
    }

    public listen = (newMessageCallback: (msg: any, senderId: CruxId | undefined) => any, errorCallback: (err: any) => any): void => {
        if (!this.selfMessenger) {
            throw Error("Cannot listen with no selfMessenger");
        }
        console.log("SecureCruxIdMessenger::listen::entry");
        this.selfMessenger.on(EventBusEventNames.newMessage, async (encryptedString: string) => {
            try {
                console.log("SecureCruxIdMessenger::listen::onblock::entry: ", this.selfIdClaim!);
                console.log("encryptedString::Detail::type and buffer",encryptedString, encryptedString);
                const serializedSecurePacket: string = await EncryptionManager.decrypt(encryptedString, this.selfIdClaim!.keyManager);
                const securePacket: ISecurePacket = JSON.parse(serializedSecurePacket);
                let senderUser: CruxUser | undefined;
                if (securePacket.certificate) {
                    console.log("SecureCruxIdMessenger::listen::onblock::claim: ", securePacket.certificate.claim);
                    senderUser = await this.cruxUserRepo.getByCruxId(CruxId.fromString(securePacket.certificate.claim));
                    if (!senderUser) {
                        errorCallback(new Error("Claimed sender user in certificate does not exist"));
                        return;
                    }
                    const isVerified = CertificateManager.verify(securePacket.certificate, senderUser.publicKey!);
                    if (!isVerified) {
                        errorCallback(new Error("Could not validate identity"));
                        return;
                    }
                }
                newMessageCallback(securePacket.data, senderUser ? senderUser.cruxID : undefined);
            } catch (error) {
                console.log("listen on error", error);
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

interface CruxMessengerEvents {
    newMessage: (data: string) => void;
    error: (err: any) => void;
}

export class CruxIdMessenger {
    public selfId?: CruxId;
    private pubsubClient: IPubSubClient;
    private subscribePromise: any;
    private emitter: Emitter<CruxMessengerEvents>;

    constructor(pubsubClient: IPubSubClient, selfId?: CruxId) {
        this.pubsubClient = pubsubClient;
        this.emitter = createNanoEvents();
        const selfTopic = "topic_" + (selfId ? selfId!.toString() : makeUUID4());
        this.subscribePromise = pubsubClient.subscribe(selfTopic, (topic: any, data: any) => {
            this.emitter.emit("newMessage", data);
        }, (err: any) => {
            this.emitter.emit("error", err);
        });
        this.selfId = selfId;
    }

    public on(eventName: EventBusEventNames, callback: (msg: string) => void): void {
        this.emitter.on(eventName, callback);
    }

    public async send(data: string, recipientId: CruxId): Promise<void> {
        await this.subscribePromise;
        return new Promise(async (resolve, reject) => {
            const recipientTopic = "topic_" + recipientId.toString();
            await this.pubsubClient.publish(recipientTopic, data);
            resolve();
        });
    }
}
