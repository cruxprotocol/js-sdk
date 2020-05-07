// @ts-ignore
import * as StrongPubsubClient from "strong-pubsub";
// @ts-ignore
import * as MqttAdapter from "strong-pubsub-mqtt";
import {CruxGateway} from "../../core/entities";
import {
    ICruxGatewayRepository,
    IGatewayIdentityClaim,
    IGatewayProtocolHandler,
    IPubSubProvider,
} from "../../core/interfaces";
import {CruxId, getRandomHexString} from "../../packages";

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
    linkServer: {
        host: string,
        port: number,
    };
    selfIdClaim: IGatewayIdentityClaim;
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

export class StrongPubSubProvider implements IPubSubProvider {
    private client: StrongPubsubClient;
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
        this.client = new StrongPubsubClient(this.config.clientOptions, MqttAdapter);
    }
    private ensureClient() {
        if (!this.client) {
            this.connect();
        }
    }
}

export class CruxGatewayRepository implements ICruxGatewayRepository {
    private options: ICruxGatewayRepositoryRepositoryOptions;
    private supportedProtocols: any;
    private pubsubProvider: StrongPubSubProvider;
    private selfCruxId?: CruxId;
    constructor(options: ICruxGatewayRepositoryRepositoryOptions) {
        this.options = options;
        this.selfCruxId = options.selfIdClaim ? options.selfIdClaim.cruxId : undefined;
        const selfClientId = "client_" + (this.selfCruxId ? this.selfCruxId.toString() : getRandomHexString(8));
        this.pubsubProvider = new StrongPubSubProvider({
            clientOptions: {
                host: options.linkServer.host,
                port: options.linkServer.port,
                // tslint:disable-next-line:object-literal-sort-keys
                mqtt: {
                    clean: false,
                    clientId: selfClientId,
                },
            },
            subscribeOptions: {
                qos: 0,
            },
        });
        this.supportedProtocols = [ CruxGatewayPaymentsProtocolHandler ];
    }
    public openGateway(protocol: string): CruxGateway {
        // TODO: override this.options.cruxBridgeConfig as per receiver's config
        const protocolHandler = getProtocolHandler(this.supportedProtocols, protocol);
        return new CruxGateway(this.pubsubProvider, protocolHandler, this.options.selfIdClaim);
    }

}
