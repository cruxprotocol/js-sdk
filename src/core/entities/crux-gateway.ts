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
    private recipient: CruxId;
    private eventSocket: IGatewayEventSocket;

    constructor(protocolHandler: IGatewayProtocolHandler, transport: ICruxGatewayTransport, recipient: CruxId, selfClaim?: IGatewayIdentityClaim) {
        // const that = this;
        this.selfClaim = selfClaim;
        this.recipient = recipient;
        this.transport = transport;
        this.messageListener = (message) => undefined;
        this.protocolHandler = protocolHandler;
        this.eventSocket = this.transport.connect(recipient);
    }

    public sendMessage(message: any) {
        this.protocolHandler.validateMessage(message);
        this.eventSocket.send(message);
    }

    public listen(messageListener: (message: any) => void, errorListener?: (message: any) => void) {
        this.eventSocket.on(EventSocketEventNames.newMessage, (foo: any) => {
            this.protocolHandler.validateMessage(foo);
            messageListener(foo);
        });
    }
}
