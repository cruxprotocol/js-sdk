// @ts-ignore
import * as Joi from "@hapi/joi";
import {makeUUID4} from "blockstack/lib";
import mqtt from "mqtt";
import {createNanoEvents, DefaultEvents, Emitter} from "nanoevents";
// @ts-ignore
import * as paho from "paho-mqtt";
// @ts-ignore
import Client from "strong-pubsub";
// @ts-ignore
import MqttAdapter from "strong-pubsub-mqtt";
// @ts-ignore
import * as ws from "ws";
import {
    ICruxIdClaim, IMessageSchema,
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

export class StrongPubSubClient implements IPubSubClient {
    private client: Client;
    private config: IStrongPubSubProviderConfig;
    constructor(config: IStrongPubSubProviderConfig) {
        this.config = config;
    }
    public publish(topic: string, data: any): void {
        this.ensureClient();
        this.client.publish(topic, data);
    }
    public subscribe(topic: string, callback: any): void {
        this.ensureClient();
        this.client.subscribe(topic, this.config.subscribeOptions);
        this.client.on("message", callback);
    }
    private connect() {
        this.client = new Client(this.config.clientOptions, MqttAdapter);
    }
    private ensureClient() {
        if (!this.client) {
            this.connect();
        }
    }
}

export class PahoClient implements IPubSubClient {
    private client: any;
    private config: IPahoPubSubProviderConfig;
    private emitter: Emitter<DefaultEvents>;
    constructor(config: IPahoPubSubProviderConfig) {
        this.config = config;
        // @ts-ignore
        if (!global.WebSocket) {
            // @ts-ignore
            global.WebSocket = ws.default;
        }
        this.emitter = createNanoEvents();
    }
    public async publish(topic: string, data: any): Promise<void> {
        console.log("PahoClient.publish", topic);
        await this.connect();
        const message = new paho.Message(data);
        message.destinationName = topic;
        message.qos = 2;
        this.client.send(message);
    }
    public async subscribe(topic: string, callback: any): Promise<void> {
        console.log("PahoClient.subscribe", topic);
        await this.connect();
        // @ts-ignore
        this.client.onMessageArrived = (msg: any) => {
            this.onMessageArrived(msg);
        };
        this.client.subscribe(topic, this.config.subscribeOptions);
        this.emitter.on(topic, (tpc: any, data: any) => {
            console.log("recd message from PahoClient.emitter", tpc, data);
            callback(tpc, data);
        });
    }
    private async connect() {
        console.log("PahoClient trying to connect");
        if (this.client && this.client.isConnected()) {
            console.log("Already Connected, returning");
            return;
        }
        return new Promise((res, rej) => {
            if (!this.client) {
                this.client = new paho.Client(this.config.clientOptions.host, this.config.clientOptions.port, this.config.clientOptions.path, this.config.clientOptions.clientId);
            }
            this.client.connect({
                onSuccess: (onSuccessData: any) => {
                    console.log("Success: ", onSuccessData);
                    res(onSuccessData);
                },
                // tslint:disable-next-line: object-literal-sort-keys
                onFailure: (onFailureData: any) => {
                    console.log("Failure: ", onFailureData);
                    rej(onFailureData);
                },
                cleanSession: false,
            });
        });
    }

    private onMessageArrived = (msg: any) => {
        console.log("recd message from paho library: " + msg);
        this.emitter.emit(msg.destinationName, msg.destinationName, msg.payloadString);
    }
//     private async ensureClient() {
//         console.log("+++++++++", this.client);
//         if (!this.client) {
//             console.log("===========");
//             await this.connect();
//         }
//     }
}

export class CruxNetPubSubClientFactory implements IPubSubClientFactory {
    private options: ICruxNetClientFactoryOptions;
    private defaultSubscribeOptions: { qos: number };
    private defaultClientMqttOptions: { clean: boolean };
    private bufferPahoClient?: PahoClient;
    constructor(options: ICruxNetClientFactoryOptions) {
        this.options = options;
        this.defaultSubscribeOptions = {
            qos: 2,
        };
        this.defaultClientMqttOptions = {
            clean: false,
        };
    }
    public getSelfClient = (idClaim: ICruxIdClaim): IPubSubClient => {
        if (this.bufferPahoClient) { return this.bufferPahoClient; }
        const overrideOpts = this.getDomainLevelClientOptions(idClaim.cruxId);
        this.bufferPahoClient = new PahoClient({
            clientOptions: {
                clientId: idClaim.cruxId.toString(),
                host: overrideOpts ? overrideOpts.host : this.options.defaultLinkServer.host,
                path: overrideOpts ? overrideOpts.path : this.options.defaultLinkServer.path,
                port: overrideOpts ? overrideOpts.port : this.options.defaultLinkServer.port,
                // tslint:disable-next-line: object-literal-sort-keys
            },
            subscribeOptions: this.defaultSubscribeOptions,
        });
        return this.bufferPahoClient;
    }
    public getRecipientClient = (recipientCruxId: CruxId, selfCruxId?: CruxId): IPubSubClient => {
        if (this.bufferPahoClient) { return this.bufferPahoClient; }
        const overrideOpts = this.getDomainLevelClientOptions(recipientCruxId);
        this.bufferPahoClient = new PahoClient({
            clientOptions: {
                // @ts-ignore
                clientId: selfCruxId.toString(),
                host: overrideOpts ? overrideOpts.host : this.options.defaultLinkServer.host,
                path: overrideOpts ? overrideOpts.path : this.options.defaultLinkServer.path,
                port: overrideOpts ? overrideOpts.port : this.options.defaultLinkServer.port,
                // tslint:disable-next-line: object-literal-sort-keys
            },
            subscribeOptions: this.defaultSubscribeOptions,
        });
        return this.bufferPahoClient;

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
