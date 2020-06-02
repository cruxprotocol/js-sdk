// @ts-ignore
import * as Joi from "@hapi/joi";
import {makeUUID4} from "blockstack/lib";
import {createNanoEvents, DefaultEvents, Emitter} from "nanoevents";
// @ts-ignore
import * as paho from "paho-mqtt";
// @ts-ignore
// @ts-ignore
// @ts-ignore
import * as ws from "ws";
import {
    IKeyManager,
    IMessageSchema,
    IPubSubClient,
    IPubSubClientFactory,
} from "../../core/interfaces";
import {CruxId} from "../../packages";

interface ICruxNetClientFactoryOptions {
    defaultLinkServer: {
        host: string,
        port: number,
        path: string
        clientId?: string,
    };
}

export interface IStrongPubSubProviderConfig {
    clientOptions: {
        host: string,
        port: number,
        mqtt: {
            clean: boolean,
            clientId: string,
        },
    };
    subscribeOptions: {
        qos: number,
    };
}

export interface IPahoPubSubProviderConfig {
    clientOptions: {
        host: string,
        port: number,
        path: string,
        clientId: string,
    };
    subscribeOptions: {
        qos: number,
    };
}

// export class StrongPubSubClient implements IPubSubClient {
//     private client: Client;
//     private config: IStrongPubSubProviderConfig;
//     constructor(config: IStrongPubSubProviderConfig) {
//         this.config = config;
//     }
//     public publish(topic: string, data: any): void {
//         this.ensureClient();
//         this.client.publish(topic, data);
//     }
//     public subscribe(topic: string, callback: any): void {
//         this.ensureClient();
//         this.client.subscribe(topic, this.config.subscribeOptions);
//         this.client.on("message", callback);
//     }
//     private connect() {
//         this.client = new Client(this.config.clientOptions, MqttAdapter);
//     }
//     private ensureClient() {
//         if (!this.client) {
//             this.connect();
//         }
//     }
// }

export class PahoClient implements IPubSubClient {
    private config: IPahoPubSubProviderConfig;
    private emitter: Emitter<DefaultEvents>;
    private client: any;
    constructor(config: IPahoPubSubProviderConfig) {
        this.config = config;
        this.emitter = createNanoEvents();
        this.setupEnvironment();
    }
    public onError = (callback: any) => {
        this.emitter.on("error", callback);
    }
    public publish = async (topic: string, data: any) => {
        // await this.connect();
        return new Promise(async (resolve, reject) => {
            const message: any = new paho.Message(data);
            message.destinationName = topic;
            message.qos = 2;
            message.uniqueId = makeUUID4();
            console.log("PahoClient - sending msg with id:", message.uniqueId);
            this.client.send(message);
            this.emitter.on("msgdelivered_" + message.uniqueId, (msg) => {
                console.log("PahoClient - send successful!:", msg.uniqueId);
                resolve(data);
            });
        });
    }
    public subscribe = async (topic: string, callback: any) => {
        console.log("PahoClient - subscribing to topic:", topic);
        // await this.connect();
        return new Promise(async (resolve, reject) => {
            this.client.subscribe(topic, {
                ...this.config.subscribeOptions,
                onSuccess: () => {
                    console.log("PahoClient - subscribe success:", topic);
                    resolve();
                },
                // tslint:disable-next-line:object-literal-sort-keys
                onFailure: (err: any) => {
                    console.log("PahoClient - subscribe failure:", topic);
                    reject(err);
                },
            });
            this.emitter.on(topic, callback);
        });
    }

    public connect = () => {
        console.log("PahoClient trying to connect: ", this.config);
        if (this.client && this.client.isConnected()) {
            console.log("Already Connected, returning");
            return;
        }
        console.log("Not Connected, Reconnecting");
        return new Promise((res, rej) => {
            if (!this.client) {
                this.client = new paho.Client(this.config.clientOptions.host, this.config.clientOptions.port, this.config.clientOptions.path, this.config.clientOptions.clientId);
            }
            this.client.onMessageArrived = this.onMessageArrived;
            this.client.onMessageDelivered = this.onMessageDelivered;
            // TODO: There's one more event to handle
            console.log("PahoClient - trying to connect");
            this.client.connect({
                onSuccess: (onSuccessData: any) => {
                    console.log("PahoClient - connect success!", this.config);
                    this.emitter.emit("connectSuccess", onSuccessData);
                    res(onSuccessData);
                },
                // tslint:disable-next-line: object-literal-sort-keys
                onFailure: (onFailureData: any) => {
                    console.log("PahoClient - connect failure!");
                    console.log("Failure: ", onFailureData);
                    rej(onFailureData);
                },
                cleanSession: false,
            });
        });
    }
    private setupEnvironment = () => {
        // @ts-ignore
        if (!global.WebSocket) {
            // @ts-ignore
            global.WebSocket = ws.default;
        }
    }
    private onMessageArrived = (msg: any) => {
        console.log("recd message from paho library: ", msg.uniqueId, msg, msg.payloadString, msg.destinationName);
        this.emitter.emit(msg.destinationName, msg.destinationName, msg.payloadString);
    }
    private onMessageDelivered = (msg: any) => {
        // console.log("PahoClient - onMessageDelivered", msg.uniqueId);
        this.emitter.emit("msgdelivered_" + msg.uniqueId, msg);
    }
}

export class CruxNetPubSubClientFactory implements IPubSubClientFactory {
    private options: ICruxNetClientFactoryOptions;
    private defaultSubscribeOptions: { qos: number };
    private defaultClientMqttOptions: { clean: boolean };
    private bufferPahoClient: any = {};
    constructor(options: ICruxNetClientFactoryOptions) {
        this.options = options;
        this.defaultSubscribeOptions = {
            qos: 2,
        };
        this.defaultClientMqttOptions = {
            clean: false,
        };
    }
    public getClient = (from: CruxId, keyManager: IKeyManager, to?: CruxId): IPubSubClient => {
        if (this.bufferPahoClient[from.toString()]) { return this.bufferPahoClient[from.toString()]; }
        const overrideOpts = this.getDomainLevelClientOptions(to ? to : from);
        this.bufferPahoClient[from.toString()] = new PahoClient({
            clientOptions: {
                clientId: from.toString(),
                host: overrideOpts ? overrideOpts.host : this.options.defaultLinkServer.host,
                path: overrideOpts ? overrideOpts.path : this.options.defaultLinkServer.path,
                port: overrideOpts ? overrideOpts.port : this.options.defaultLinkServer.port,
                // tslint:disable-next-line: object-literal-sort-keys
            },
            subscribeOptions: this.defaultSubscribeOptions,
        });
        return this.bufferPahoClient[from.toString()];
    }
    private getDomainLevelClientOptions = (cruxId: CruxId): {host: string, port: number, path: string} | undefined => {
        // TODO Implement
        return;
    }
}

export const cruxPaymentProtocol: IMessageSchema[] = [{
    messageType: "PAYMENT_REQUEST",
    schema: Joi.object({
        amount: Joi.string()
            .required(),

        toAddress: Joi.object({
            addressHash: Joi.string().required(),
            secIdentifier: Joi.string(),
        }).required(),

        assetId: Joi.string()
            .required().min(36).max(36),
    }),
}];

export const keyManagementProtocol: IMessageSchema[] = [
    {
        messageType: "KEY_MANAGER_REQUEST",
        schema: Joi.object({
            args: Joi.array()
                .required(),

            invocationId: Joi.string()
                .required().min(36).max(36),

            method: Joi.string().valid("signWebToken", "getPubKey", "deriveSharedSecret", "decryptMessage")
                .required(),
        }),
    },
    {
        messageType: "KEY_MANAGER_RESPONSE",
        schema: Joi.object({
            data: Joi.any()
                        .required(),

            invocationId: Joi.string()
                .required().min(36).max(36),
        }),
    },
];
