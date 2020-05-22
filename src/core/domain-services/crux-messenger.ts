import {makeUUID4} from "blockstack/lib";
import {decodeToken, TokenVerifier} from "jsontokens";
import {createNanoEvents, DefaultEvents, Emitter} from "nanoevents";
import {BufferJSONSerializer, CruxId} from "../../packages";
import { ECIESEncryption } from "../../packages/encryption";
import {CruxUser} from "../entities";

import {
    ICruxIdCertificate,
    ICruxIdClaim,
    ICruxUserRepository,
    IKeyManager,
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
        // TODO: Handle encoding properly (UTF-8 might not work in all scenarios)
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

export type Listener = ((dataReceived: any) => void);

export class BaseSocket {
    public socketId: string;
    public type: string;
    public client: IPubSubClient;
    public selfId: CruxId;
    constructor(type: string, client: IPubSubClient, selfId: CruxId) {
        if (!["send", "receive"].includes(type)) {
            throw Error("Type must be send or receive");
        }
        this.type = type;
        this.socketId = `socket:${type}:${makeUUID4()}`;
        this.client = client;
        this.selfId = selfId;
    }
}

export class SendSocket extends BaseSocket {
    public recipientId: CruxId;
    constructor(selfId: CruxId, recipientId: CruxId, client: IPubSubClient) {
        super("send", client, selfId);
        this.recipientId = recipientId;
    }
    public send = (data: any) => {
        const recipientTopic = "topic_" + this.recipientId.toString();
        this.client.publish(recipientTopic, data);
    }
}

export class ReceiveSocket extends BaseSocket {
    constructor(selfId: CruxId, client: IPubSubClient) {
        super("receive", client, selfId);
    }
    public receive = (listener: Listener) => {
        const selfTopic = "topic_" + this.selfId;
        this.client.subscribe(selfTopic, (topic: any, data: any) => {
            console.log("CruxIdMessenger recd msg from pubsubClient", topic, data);
            listener(data);
        });
    }
}

export class CruxNetwork {
    private clientFactory: IPubSubClientFactory;
    constructor(clientFactory: IPubSubClientFactory) {
        this.clientFactory = clientFactory;
    }

    public getReceiveSocket = (cruxId: CruxId, keyManager: IKeyManager): ReceiveSocket => {
        // TODO: Make clientFactory just deal with making client
        // make CruxNetwork deal with selecting parameters
        const client: IPubSubClient = this.clientFactory.getClient(cruxId, keyManager);
        return new ReceiveSocket(cruxId, client);
    }
    public getSendSocket = (recipientCruxId: CruxId, senderCruxId: CruxId, keyManager: IKeyManager): SendSocket => {
        const client: IPubSubClient = this.clientFactory.getClient(senderCruxId, keyManager, recipientCruxId);
        return new SendSocket(senderCruxId, recipientCruxId, client);
    }
}
// -------

class BaseSecureSocket extends BaseSocket {
    public userRepository: ICruxUserRepository;
    public selfIdClaim: ICruxIdClaim;
    constructor(type: string, client: IPubSubClient, userRepository: ICruxUserRepository, selfIdClaim: ICruxIdClaim) {
        super(type, client, selfIdClaim.cruxId);
        this.userRepository = userRepository;
        this.selfIdClaim = selfIdClaim;
    }
}

export class SecureSendSocket extends BaseSecureSocket {
    private sendSocket: SendSocket;
    constructor(sendSocket: SendSocket, userRepository: ICruxUserRepository, selfIdClaim: ICruxIdClaim) {
        super("send", sendSocket.client, userRepository, selfIdClaim);
        this.sendSocket = sendSocket;
    }
    public send = async (data: any) => {
        console.log("yo");
        const recipientCruxUser: CruxUser | undefined = await this.userRepository.getByCruxId(this.sendSocket.recipientId);
        if (!recipientCruxUser) {
            throw Error("No Such CRUX User Found");
        }
        const certificate = this.selfIdClaim ? await CertificateManager.make(this.selfIdClaim) : undefined;
        const securePacket: ISecurePacket = {
            certificate,
            data,
        };
        const serializedSecurePacket = JSON.stringify(securePacket);
        const encryptedSecurePacket = await EncryptionManager.encrypt(serializedSecurePacket, recipientCruxUser.publicKey!);
        this.sendSocket.send(encryptedSecurePacket);
    }
}

export class SecureReceiveSocket extends BaseSecureSocket {
    private receiveSocket: ReceiveSocket;
    private emitter: Emitter<DefaultEvents>;
    constructor(receiveSocket: ReceiveSocket, userRepository: ICruxUserRepository, selfIdClaim: ICruxIdClaim) {
        super("receive", receiveSocket.client, userRepository, selfIdClaim);
        this.receiveSocket = receiveSocket;
        this.emitter = createNanoEvents();
    }
    public receive = (listener: Listener) => {
        this.receiveSocket.receive(async (dataReceived: any) => {
            const serializedSecurePacket: string = await EncryptionManager.decrypt(dataReceived, this.selfIdClaim!.keyManager);
            const securePacket: ISecurePacket = JSON.parse(serializedSecurePacket);
            let senderUser: CruxUser | undefined;
            if (securePacket.certificate) {
                senderUser = await this.userRepository.getByCruxId(CruxId.fromString(securePacket.certificate.claim));
                if (!senderUser) {
                    this.emitter.emit("error", new Error("Claimed sender user in certificate does not exist"));
                    return;
                }
                const isVerified = CertificateManager.verify(securePacket.certificate, senderUser.publicKey!);
                if (!isVerified) {
                    this.emitter.emit("error", new Error("Could not validate identity"));
                    return;
                }
            }
            listener(securePacket.data);
        });
    }
    public onError = (handler: any) => {
        this.emitter.on("error", handler);
    }
}

export class SecureCruxNetwork {
    private cruxNetwork: CruxNetwork;
    private secureSocketWrapper: SecureSocketWrapper;
    private selfIdClaim: ICruxIdClaim;
    constructor(cruxUserRepo: ICruxUserRepository, pubsubClientFactory: IPubSubClientFactory, selfIdClaim: ICruxIdClaim) {
        this.selfIdClaim = selfIdClaim;
        this.cruxNetwork = new CruxNetwork(pubsubClientFactory);
        this.secureSocketWrapper = new SecureSocketWrapper(cruxUserRepo, pubsubClientFactory, selfIdClaim);
    }

    public getReceiveSocket = (): SecureReceiveSocket => {
        const receiveSocket: ReceiveSocket = this.cruxNetwork.getReceiveSocket(this.selfIdClaim.cruxId, this.selfIdClaim.keyManager);
        return this.secureSocketWrapper.wrapReceiveSocket(receiveSocket);
    }
    public getSendSocket = (recipientCruxId: CruxId): SecureSendSocket => {
        const sendSocket: SendSocket = this.cruxNetwork.getSendSocket(recipientCruxId, this.selfIdClaim.cruxId, this.selfIdClaim.keyManager);
        return this.secureSocketWrapper.wrapSendSocket(sendSocket);
    }
}

export class SecureSocketWrapper {
    private selfIdClaim: ICruxIdClaim;
    private cruxUserRepo: ICruxUserRepository;
    constructor(cruxUserRepo: ICruxUserRepository, pubsubClientFactory: IPubSubClientFactory, selfIdClaim: ICruxIdClaim) {
        this.cruxUserRepo = cruxUserRepo;
        this.selfIdClaim = selfIdClaim;
    }
    public wrapSendSocket = (sendSocket: SendSocket) => {
        return new SecureSendSocket(sendSocket, this.cruxUserRepo, this.selfIdClaim);
    }
    public wrapReceiveSocket = (receiveSocket: ReceiveSocket) => {
        return new SecureReceiveSocket(receiveSocket, this.cruxUserRepo, this.selfIdClaim);
    }
}

// ---------

export class SecureCruxNetworkMessenger {
    private secureCruxNetwork: SecureCruxNetwork;
    constructor(cruxUserRepo: ICruxUserRepository, pubsubClientFactory: IPubSubClientFactory, selfIdClaim: ICruxIdClaim) {
        this.secureCruxNetwork = new SecureCruxNetwork(cruxUserRepo, pubsubClientFactory, selfIdClaim);
    }
    public send = async (recipientId: CruxId, data: any) => {
        const sendSocket: SecureSendSocket = this.secureCruxNetwork.getSendSocket(recipientId);
        await sendSocket.send(data);
    }
    public receive = (listener: Listener) => {
        const receiveSocket: SecureReceiveSocket = this.secureCruxNetwork.getReceiveSocket();
        receiveSocket.receive(listener);
    }
}

// export class CruxConnectProtocolMessenger {
//     private secureMessenger: SecureCruxIdMessenger;
//     private schemaByMessageType: any;
//     private errorHandler: (error: any) => void;
//     private messageHandlerByType: {[type: string]: (data: any, senderId?: CruxId) => void};
//
//     constructor(secureMessenger: SecureCruxIdMessenger, protocol: IMessageSchema[]) {
//         this.secureMessenger = secureMessenger;
//         this.schemaByMessageType = protocol.reduce((newObj, x) => Object.assign(newObj, {[x.messageType]: x.schema}), {});
//         // tslint:disable-next-line:no-empty
//         this.errorHandler = (error) => {};
//         this.messageHandlerByType = {};
//         this.secureMessenger.listen((msg: IProtocolMessage, senderId?: CruxId) => {
//             this.handleNewMessage(msg, senderId);
//         }, (e: Error) => {
//             this.handleNewError(e);
//         });
//     }
//     public send = async (message: IProtocolMessage, recipientCruxId: CruxId): Promise<void> => {
//         this.validateMessage(message);
//         this.secureMessenger.send(message, recipientCruxId);
//     }
//     public on = (messageType: string, callback: (data: any, senderId?: CruxId) => void) => {
//         this.getSchema(messageType);
//         this.messageHandlerByType[messageType] = callback;
//     }
//     public validateMessage = (message: IProtocolMessage): void => {
//         const schema = this.getSchema(message.type);
//         this.validateContent(message.content, schema);
//     }
//
//     private handleNewMessage = (message: IProtocolMessage, senderId?: CruxId) => {
//         try {
//             this.validateMessage(message);
//         } catch (e) {
//             this.handleNewError(e);
//             return;
//         }
//         const callback = this.messageHandlerByType[message.type];
//         if (callback) {
//             callback(message.content, senderId);
//         }
//
//     }
//     private handleNewError = (error: any) => {
//         this.errorHandler(error);
//     }
//
//     private getSchema = (messageType: string): any => {
//         const schema = this.schemaByMessageType[messageType];
//         if (!schema) {
//             throw Error("Did not recognize message type");
//         }
//         return schema;
//     }
//     private validateContent = (content: any, schema: any): void => {
//         // @ts-ignore
//         const result = schema.validate(content);
//         if (result.error) {
//             throw new Error("Could not validate message as per schema- " + result.error.message);
//         }
//     }
// }
