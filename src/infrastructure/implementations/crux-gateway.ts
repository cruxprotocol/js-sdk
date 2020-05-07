// @ts-ignore
import {createSecretKey} from "crypto";
// @ts-ignore
import Client from "strong-pubsub";
// @ts-ignore
import MqttAdapter from "strong-pubsub-mqtt";
import {CruxGateway} from "../../core/entities";
import {
    ICruxGatewayRepository, ICruxIdPubSubChannel,
    IGatewayIdentityClaim,
    IGatewayProtocolHandler,
    IPubSubClient,
} from "../../core/interfaces";
import {CruxId, getRandomHexString} from "../../packages";
import undefinedError = Mocha.utils.undefinedError;

// ---------------- SETTING UP PROTOCOL HANDLERS ----------------------------

export class CruxGatewayPaymentsProtocolHandler implements IGatewayProtocolHandler {
    public getName(): string {
        return "CRUX.PAYMENT";
    }

    public validateMessage(gatewayMessage: any): boolean {
        return true;
    }
}

export const getProtocolHandler = (protocolHandlers: any, gatewayProtocol: string): IGatewayProtocolHandler => {
    const protocolHandlerByName: any = {};
    protocolHandlers.forEach( (protocolHandlerClass: any) => {
        const protocolHandlerObj = new protocolHandlerClass();
        protocolHandlerByName[protocolHandlerObj.getName()] = protocolHandlerObj;
    });
    const handler =  protocolHandlerByName[gatewayProtocol];
    if (!handler) {
        throw Error("Unsupported protocol");
    }
    return handler;
};

export interface ICruxGatewayRepositoryRepositoryOptions {
    defaultLinkServer: {
        host: string,
        port: number,
    };
    selfIdClaim?: IGatewayIdentityClaim;
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

export class CruxLinkGatewayRepository implements ICruxGatewayRepository {
    private options: ICruxGatewayRepositoryRepositoryOptions;
    private supportedProtocols: any;
    private selfPubSubChannel?: ICruxIdPubSubChannel;
    constructor(options: ICruxGatewayRepositoryRepositoryOptions) {
        this.options = options;
        this.supportedProtocols = [ CruxGatewayPaymentsProtocolHandler ];
        const selfPubsubClient = options.selfIdClaim ? this.getPubsubClientFor(options.selfIdClaim.cruxId) : undefined;
        if (selfPubsubClient && options.selfIdClaim) {
            this.selfPubSubChannel = {
                ...options.selfIdClaim,
                pubsubClient: selfPubsubClient,
            };
        }
    }
    public openGateway(protocol: string, receiverId?: CruxId): CruxGateway {
        const protocolHandler = getProtocolHandler(this.supportedProtocols, protocol);
        const receiverPubSubClient = receiverId ? this.getPubsubClientFor(receiverId) : undefined;
        let receiverPubSubChannel: ICruxIdPubSubChannel | undefined;
        if (receiverId && receiverPubSubClient) {
            receiverPubSubChannel = {
                cruxId: receiverId,
                pubsubClient: receiverPubSubClient,
            };
            return new CruxGateway(protocolHandler, this.selfPubSubChannel, receiverPubSubChannel);
        } else {
            throw Error("Receiver does not exist or client not found");
        }
    }
    private getPubsubClientFor(cruxId?: CruxId): IPubSubClient | undefined {
        let provider: IPubSubClient;
        if (!cruxId) {
            return undefined;
        }
        const clientId = "client_" + cruxId.toString();
        provider = new StrongPubSubClient({
            clientOptions: {
                host: this.options.defaultLinkServer.host,
                port: this.options.defaultLinkServer.port,
                // tslint:disable-next-line:object-literal-sort-keys
                mqtt: {
                    clean: false,
                    clientId,
                },
            },
            subscribeOptions: {
                qos: 0,
            },
        });
        return provider;
    }

}
