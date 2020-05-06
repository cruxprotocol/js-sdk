// @ts-ignore
import * as StrongPubsubClient from "strong-pubsub";
// @ts-ignore
import * as MqttAdapter from "strong-pubsub-mqtt";
import {
    CruxGateway,
    EventBusEventNames,
    } from "../../core/entities";
import {
    ICruxGatewayRepository,
    ICruxGatewayTransport,
    IGatewayEventBus, IGatewayIdentityClaim,
    IGatewayProtocolHandler,
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

class IProtocolHandlerMapping {
    [protocolName: string]: IGatewayProtocolHandler;
}

const getProtocolHandler = (gatewayProtocol: string): IGatewayProtocolHandler => {
    const protocolHandlers = [ PaymentRequestGatewayProtocolHandler];
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

class Proxy {
    private eventName: EventBusEventNames;
    private eventBus: IGatewayEventBus;
    constructor(eventBus: IGatewayEventBus, eventName: EventBusEventNames) {
        this.eventName = eventName;
        this.eventBus = eventBus;
    }
    public redirect(msg: any) {
        const callbackForEventName = this.eventBus.getRegisteredCallback(this.eventName);
        if (!callbackForEventName) {
            console.log("No Registered callback. Event wasted");
        } else {
            callbackForEventName(msg);
        }
    }
}

export class StrongPubSubTransport implements ICruxGatewayTransport {
    private selfId: CruxId | undefined;
    private client: StrongPubSubEventBus;

    constructor(config: ICruxBridgeConfig, selfId?: CruxId) {
        this.selfId = selfId;
        const selfClientId = "client_" + (this.selfId ? this.selfId.toString() : getRandomHexString(8));
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
    public connect(recipient?: CruxId): IGatewayEventBus {
        if (!recipient && !this.selfId) {
            throw Error("Cannot create which can't receive or send");
        }
        return new StrongPubSubEventBus(this.client, recipient, this.selfId);
    }

}

class StrongPubSubEventBus implements IGatewayEventBus {
    private client: StrongPubsubClient;
    private options: { qos: number };
    private registeredCallbacks: any;
    private recipient?: CruxId;
    private selfId?: CruxId;

    constructor(client: StrongPubsubClient, recipient?: CruxId, selfId?: CruxId) {
        this.options = {
            qos: 0,
        };
        this.registeredCallbacks = {};

        if (!recipient && !selfId) {
            throw Error("Invalid state. One of recipient or selfId must be present");
        }

        if (selfId) {
            const selfTopic = "topic_" + selfId.toString();
            this.client.subscribe(selfTopic, this.options);
            this.client.on("message", new Proxy(this, EventBusEventNames.newMessage).redirect);
        }
        this.selfId = selfId;
        this.recipient = recipient;
    }

    public on(eventName: EventBusEventNames, callback: any): void {
        if (!this.selfId) {
            throw Error("Cannot receive messages as this bus has no selfId");
        }
        this.registeredCallbacks[eventName] = callback;
    }

    public send(data: any): void {
        if (!this.recipient) {
            throw Error("Cannot send in a bus with no recipient");
        }
        const recipientTopic = "topic_" + this.recipient.toString();
        this.client.publish(recipientTopic, data);
    }

    public getRegisteredCallback(eventName: string) {
        return this.registeredCallbacks[eventName];
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
        const transport = new StrongPubSubTransport(this.options.cruxBridgeConfig, selfCruxId);
        const protocolHandler = getProtocolHandler(protocol);
        if (!protocolHandler) {
            throw Error("Unsupported protocol");
        }
        return new CruxGateway(protocolHandler, transport, selfClaim);
    }

}
