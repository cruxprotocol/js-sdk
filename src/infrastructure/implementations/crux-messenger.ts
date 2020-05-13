// @ts-ignore
import * as Joi from "@hapi/joi";
// @ts-ignore
import Client from "strong-pubsub";
// @ts-ignore
import MqttAdapter from "strong-pubsub-mqtt";
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
        mqtt: {
            clean: boolean,
            clientId: string,
        },
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
        return new StrongPubSubClient({
            clientOptions: {
                host: overrideOpts ? overrideOpts.host : this.options.defaultLinkServer.host,
                port: overrideOpts ? overrideOpts.port : this.options.defaultLinkServer.port,
                // tslint:disable-next-line:object-literal-sort-keys
                mqtt: { ...this.defaultClientMqttOptions, clientId: "client_" + idClaim.cruxId.toString() },
            },
            subscribeOptions: this.defaultSubscribeOptions,
        });
    }
    public getRecipientClient = (selfCruxId: CruxId, recipientCruxId: CruxId): IPubSubClient => {
        const overrideOpts = this.getDomainLevelClientOptions(recipientCruxId);
        return new StrongPubSubClient({
            clientOptions: {
                host: overrideOpts ? overrideOpts.host : this.options.defaultLinkServer.host,
                port: overrideOpts ? overrideOpts.port : this.options.defaultLinkServer.port,
                // tslint:disable-next-line:object-literal-sort-keys
                mqtt: { ...this.defaultClientMqttOptions, clientId: "client_" + selfCruxId.toString() },
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
        amount: Joi.number()
            .required(),

        toAddress: Joi.string()
            .required(),

        assetId: Joi.string()
            .required(),
    }),
}];
