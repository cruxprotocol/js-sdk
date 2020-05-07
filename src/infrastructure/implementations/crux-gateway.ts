// @ts-ignore
import * as StrongPubsubClient from "strong-pubsub";
// @ts-ignore
import * as MqttAdapter from "strong-pubsub-mqtt";
import { CruxGateway } from "../../core/entities";
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

export interface ICruxBridgeConfig {
    host: string;
    port: number;
}

export interface ICruxGatewayRepositoryRepositoryOptions {
    cruxBridgeConfig: ICruxBridgeConfig;
}

export class StrongPubSubProvider implements IPubSubProvider {
    private client: StrongPubsubClient;
    private options: { qos: number };
    constructor(config: ICruxBridgeConfig, selfId?: CruxId) {
        this.options = {
            qos: 0,
        };
        const selfClientId = "client_" + (selfId ? selfId.toString() : getRandomHexString(8));
        this.client = new StrongPubsubClient({
            host: config.host,
            port: config.port,
            // tslint:disable-next-line:object-literal-sort-keys
            mqtt: {
                clean: false,
                clientId: selfClientId,
            },
        }, MqttAdapter);
    }
    public publish(topic: string, data: any): void {
        this.client.publish(topic, data);
    }
    public subscribe(topic: string, callback: any): void {
        this.client.subscribe(topic, this.options);
        this.client.on("message", callback);
    }

}

export class CruxGatewayRepository implements ICruxGatewayRepository {
    private options: ICruxGatewayRepositoryRepositoryOptions;
    private supportedProtocols: any;
    constructor(options: ICruxGatewayRepositoryRepositoryOptions) {
        this.options = options;
        this.supportedProtocols = [ CruxGatewayPaymentsProtocolHandler ];
    }
    public openGateway(protocol: string, selfClaim?: IGatewayIdentityClaim): CruxGateway {
        // TODO: override this.options.cruxBridgeConfig as per receiver's config
        const selfCruxId = selfClaim ? selfClaim.cruxId : undefined;
        const pubsubProvider = new StrongPubSubProvider(this.options.cruxBridgeConfig, selfCruxId);
        const protocolHandler = getProtocolHandler(this.supportedProtocols, protocol);
        return new CruxGateway(pubsubProvider, protocolHandler, selfClaim);
    }

}
