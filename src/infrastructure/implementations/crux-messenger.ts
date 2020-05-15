// @ts-ignore
import * as Joi from "@hapi/joi";
import {makeUUID4} from "blockstack/lib";
import mqtt from "mqtt";
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
    };
}

export interface IStrongPubSubProviderConfig {
    clientOptions: {
        host: string,
        port: number,
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

export class MqttJsClient implements IPubSubClient {
    private client: any;
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
        this.client = mqtt.connect(this.config.clientOptions, {protocol: "ws"});
        console.log(this.client);
    }
    private ensureClient() {
        if (!this.client) {
            this.connect();
        }
    }
}

export class PahoClient implements IPubSubClient {
    private client: any;
    private config: any;
    constructor(config: any) {
        this.config = config;
    }
    public async publish(topic: string, data: any): Promise<void> {
        await this.ensureClient();
        const message = new paho.Message(data);
        message.destinationName = topic;
        this.client.send(message);
    }
    public async subscribe(topic: string, callback: any): Promise<void> {
        await this.ensureClient();
        // @ts-ignore
        this.client.subscribe(topic, {qos : 0});
        this.client.onMessageArrived = (msg: any) => {
            console.log("onMessageArrived:" + msg.payloadString);
            callback(msg.payloadString);
        };
    }
    private async connect() {
        return new Promise((res, rej) => {
            global.WebSocket = ws.default;
            this.client = new paho.Client(this.config.host, this.config.port, this.config.clientId);
            this.client.connect({
                onSuccess: (onSuccessData: any) => {
                    console.log("ON SUCCESS DATA: ", onSuccessData);
                    res();
                },
                // tslint:disable-next-line: object-literal-sort-keys
                onFailure: (onFailureData: any) => {
                    console.log("ON SUCCESS DATA: ", onFailureData);
                    rej(onFailureData);
                },
                cleanSession: false,
            });
            console.log(this.client);
        });
    }
    private async ensureClient() {
        if (!this.client) {
            await this.connect();
        }
    }
}

export class CruxNetPubSubClientFactory implements IPubSubClientFactory {
    private options: ICruxNetClientFactoryOptions;
    private defaultSubscribeOptions: { qos: number };
    private defaultClientMqttOptions: { clean: boolean };
    constructor(options: ICruxNetClientFactoryOptions) {
        this.options = options;
        this.defaultSubscribeOptions = {
            qos: 0,
        };
        this.defaultClientMqttOptions = {
            clean: false,
        };
    }
    public getSelfClient = (idClaim: ICruxIdClaim): IPubSubClient => {
        const overrideOpts = this.getDomainLevelClientOptions(idClaim.cruxId);
        return new MqttJsClient({
            clientOptions: {
                host: overrideOpts ? overrideOpts.host : this.options.defaultLinkServer.host,
                port: overrideOpts ? overrideOpts.port : this.options.defaultLinkServer.port,
                // tslint:disable-next-line:object-literal-sort-keys
            },
            subscribeOptions: this.defaultSubscribeOptions,
        });
    }
    public getRecipientClient = (recipientCruxId: CruxId, selfCruxId?: CruxId): IPubSubClient => {
        const overrideOpts = this.getDomainLevelClientOptions(recipientCruxId);
        return new MqttJsClient({
            clientOptions: {
                host: overrideOpts ? overrideOpts.host : this.options.defaultLinkServer.host,
                port: overrideOpts ? overrideOpts.port : this.options.defaultLinkServer.port,
                // tslint:disable-next-line:object-literal-sort-keys
            },
            subscribeOptions: this.defaultSubscribeOptions,
        });

    }
    private getDomainLevelClientOptions = (cruxId: CruxId): {host: string, port: number} | undefined => {
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
