// @ts-ignore
import Client from "strong-pubsub";
// @ts-ignore
import MqttAdapter from "strong-pubsub-mqtt";
import {IPubSubClient} from "../../core/interfaces/crux-messenger";

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
