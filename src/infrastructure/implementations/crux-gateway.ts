// @ts-ignore
import * as StrongPubsubClient from "strong-pubsub";
// @ts-ignore
import * as MqttAdapter from "strong-pubsub-mqtt";
import {
    CruxGateway,
    EventSocketEventNames,
    } from "../../core/entities";
import {
    ICruxGatewayRepository,
    ICruxGatewayTransport,
    IGatewayEventSocket, IGatewayMessageSender,
    IGatewayProtocolHandler,
} from "../../core/interfaces/crux-gateway";
import {CruxId} from "../../packages";

// ---------------- SETTING UP PROTOCOL HANDLERS ----------------------------

export class PaymentRequestGatewayProtocolHandler implements IGatewayProtocolHandler {
    public getName(): string {
        return "PAYMENT_REQUEST";
    }

    public validateMessage(gatewayMessage: any): boolean {
        return true;
    }
}

const protocolHandlers = [ PaymentRequestGatewayProtocolHandler];

class IProtocolHandlerMapping {
    [protocolName: string]: IGatewayProtocolHandler;
}

const protocolHandlerByName: IProtocolHandlerMapping = {};
protocolHandlers.forEach( (protocolHandler: any) => {
    protocolHandlerByName[protocolHandler.getName()] = protocolHandler;
});

// ------------------------------------------------------------------------

const getProtocolHandler = (gatewayProtocol: string): IGatewayProtocolHandler => {
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
    private eventName: EventSocketEventNames;
    private eventSocket: IGatewayEventSocket;
    constructor(eventSocket: IGatewayEventSocket, eventName: EventSocketEventNames) {
        this.eventName = eventName;
        this.eventSocket = eventSocket;
    }
    public redirect(msg: any) {
        const callbackForEventName = this.eventSocket.getRegisteredCallback(this.eventName);
        if (!callbackForEventName) {
            console.log("No Registered callback. Event wasted");
        } else {
            callbackForEventName(msg);
        }
    }
}

export class StrongPubSubTransport implements ICruxGatewayTransport {
    private config: ICruxBridgeConfig;
    private self: CruxId | undefined;

    constructor(config: ICruxBridgeConfig, self?: CruxId) {
        this.config = config;
        this.self = self;
    }

    public connect(recipient: CruxId): IGatewayEventSocket {
        const selfClientId = "client_" + (self ? self.toString() : "asdasd");
        const client = new StrongPubsubClient({
            host: this.config.host,
            port: this.config.port,
            // tslint:disable-next-line:object-literal-sort-keys
            mqtt: {
                clean: false,
                clientId: selfClientId,
            },
        }, MqttAdapter);
        return new StrongPubSubEventSocket(client, recipient, this.self);
    }

}

class StrongPubSubEventSocket implements IGatewayEventSocket {
    private client: StrongPubsubClient;
    private options: { qos: number };
    private registeredCallbacks: any;
    private recipient?: CruxId;

    constructor(client: StrongPubsubClient, recipient?: CruxId, self?: CruxId) {
        this.options = {
            qos: 0,
        };
        const selfTopic = "topic_" + (self ? self.toString() : "asdasd");
        this.recipient = recipient;
        this.client.subscribe(selfTopic, this.options);
        this.client.on("message", new Proxy(this, EventSocketEventNames.newMessage).redirect);
        this.registeredCallbacks = {};
    }

    public on(eventName: EventSocketEventNames, callback: any): void {
        this.registeredCallbacks[eventName] = callback;
    }

    public send(data: any): void {
        if (!this.recipient) {
            throw Error("Cannot send in a socket with no recipient");
        }
        const recipientTopic = "topic_" + (this.recipient ? this.recipient.toString() : "asdasd");
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
    public get(protocol: string, recipient: CruxId, sender?: IGatewayMessageSender): CruxGateway {
        // TODO: override this.options.cruxBridgeConfig as per receiver's config
        const senderCruxId = sender ? sender.cruxId : undefined;
        const transport = new StrongPubSubTransport(this.options.cruxBridgeConfig, senderCruxId);
        const protocolHandler = getProtocolHandler(protocol);
        if (!protocolHandler) {
            throw Error("Unsupported protocol");
        }
        return new CruxGateway(protocolHandler, transport, recipient, sender);
    }

}
