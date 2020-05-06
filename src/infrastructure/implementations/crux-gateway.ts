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

export class PaymentRequestGatewayProtocolHandler implements IGatewayProtocolHandler {
    public getName(): string {
        return "CRUX.PAYMENT";
    }

    public validateMessage(gatewayMessage: any): boolean {
        return true;
    }
}

export class BasicGatewayProtocolHandler implements IGatewayProtocolHandler {
    public getName(): string {
        return "BASIC";
    }

    public validateMessage(gatewayMessage: any): boolean {
        return true;
    }
}

class IProtocolHandlerMapping {
    [protocolName: string]: IGatewayProtocolHandler;
}

export const getProtocolHandler = (gatewayProtocol: string): IGatewayProtocolHandler => {
    const protocolHandlers = [ PaymentRequestGatewayProtocolHandler, BasicGatewayProtocolHandler ];
    const protocolHandlerByName: IProtocolHandlerMapping = {};
    protocolHandlers.forEach( (protocolHandler: any) => {
        protocolHandlerByName[protocolHandler.getName()] = protocolHandler;
    });
    return protocolHandlerByName[gatewayProtocol];
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
    constructor(config: any, selfId?: CruxId) {
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
    constructor(options: ICruxGatewayRepositoryRepositoryOptions) {
        this.options = options;
    }
    public openGateway(protocol: string, selfClaim?: IGatewayIdentityClaim): CruxGateway {
        // TODO: override this.options.cruxBridgeConfig as per receiver's config
        const selfCruxId = selfClaim ? selfClaim.cruxId : undefined;
        const pubsubProvider = new StrongPubSubProvider(this.options.cruxBridgeConfig, selfCruxId);
        const protocolHandler = getProtocolHandler(protocol);
        if (!protocolHandler) {
            throw Error("Unsupported protocol");
        }
        return new CruxGateway(pubsubProvider, protocolHandler, selfClaim);
    }

}
