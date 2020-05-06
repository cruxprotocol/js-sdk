// @ts-ignore
// @ts-ignore

import {CruxId} from "../../packages";
import {
    ICruxGatewayTransport,
    IGatewayEventSocket, IGatewayIdentityClaim,
    IGatewayProtocolHandler,
} from "../interfaces/crux-gateway";

export enum EventSocketEventNames {
    newMessage = "newMessage",
}

export class CruxGateway {

    private protocolHandler: IGatewayProtocolHandler;
    private transport: ICruxGatewayTransport;
    private messageListener: (message: any) => void;
    private selfClaim?: IGatewayIdentityClaim;
    private recipient?: CruxId;

    constructor(protocolHandler: IGatewayProtocolHandler, transport: ICruxGatewayTransport, recipient?: CruxId, selfClaim?: IGatewayIdentityClaim) {
        // const that = this;
        if (!recipient && !selfClaim) {
            throw Error("Invalid state. One of recipient or selfId must be present");
        }
        this.selfClaim = selfClaim;
        this.recipient = recipient;
        this.transport = transport;
        this.messageListener = (message) => undefined;
        this.protocolHandler = protocolHandler;
    }

    public sendMessage(message: any) {
        if (!this.recipient) {
            throw Error("Cannot send in a gateway with no recipient");
        }
        this.protocolHandler.validateMessage(message);
        this.eventSocket.send(message);
    }

    public listen(messageListener: (message: any) => void, errorListener?: (message: any) => void) {
        if (!this.selfClaim) {
            throw Error("Cannot listen to a gateway with no selfClaim");
        }
        const eventSocket = this.transport.connect(this.recipient);
        eventSocket.on(EventSocketEventNames.newMessage, (foo: any) => {
            this.protocolHandler.validateMessage(foo);
            messageListener(foo);
        });
    }
}
