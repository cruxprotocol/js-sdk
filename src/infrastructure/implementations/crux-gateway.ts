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
    IGatewayEventSocket, IGatewayIdentityClaim,
    IGatewayProtocolHandler,
} from "../../core/interfaces";
import {CruxId} from "../../packages";

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

// ------------------------------------------------------------------------

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
    private selfId: CruxId | undefined;

    constructor(config: ICruxBridgeConfig, selfId?: CruxId) {
        this.config = config;
        this.selfId = selfId;
    }

    public connect(recipient: CruxId): IGatewayEventSocket {
        const selfClientId = "client_" + (this.selfId ? this.selfId.toString() : "asdasd");
        const client = new StrongPubsubClient({
            host: this.config.host,
            port: this.config.port,
            // tslint:disable-next-line:object-literal-sort-keys
            mqtt: {
                clean: false,
                clientId: selfClientId,
            },
        }, MqttAdapter);
        return new StrongPubSubEventSocket(client, recipient, this.selfId);
    }

}

class StrongPubSubEventSocket implements IGatewayEventSocket {
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
            throw Error("Invalid state");
        }

        if (selfId) {
            const selfTopic = "topic_" + (selfId ? selfId.toString() : "asdasd");
            this.client.subscribe(selfTopic, this.options);
            this.client.on("message", new Proxy(this, EventSocketEventNames.newMessage).redirect);
        }
        this.selfId = selfId;
        this.recipient = recipient;
    }

    public on(eventName: EventSocketEventNames, callback: any): void {
        if (!this.selfId) {
            throw Error("Cannot receive messages as this socket has no selfId");
        }
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
    public get(protocol: string, recipient: CruxId, selfClaim?: IGatewayIdentityClaim): CruxGateway {
        // TODO: override this.options.cruxBridgeConfig as per receiver's config
        const selfCruxId = selfClaim ? selfClaim.cruxId : undefined;
        const transport = new StrongPubSubTransport(this.options.cruxBridgeConfig, selfCruxId);
        const protocolHandler = getProtocolHandler(protocol);
        if (!protocolHandler) {
            throw Error("Unsupported protocol");
        }
        return new CruxGateway(protocolHandler, transport, recipient, selfClaim);
    }

}
