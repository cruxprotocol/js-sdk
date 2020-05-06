// @ts-ignore
// @ts-ignore

import {CruxId} from "../../packages";
import {
    ICruxGatewayTransport,
    IGatewayEventSocket,
    IGatewayMessageSender,
    IGatewayProtocolHandler,
} from "../interfaces/crux-gateway";

export enum EventSocketEventNames {
    newMessage = "newMessage",
}

export class CruxGateway {

    private protocolHandler: IGatewayProtocolHandler;
    private transport: ICruxGatewayTransport;
    private messageListener: (message: any) => void;
    private sender?: IGatewayMessageSender;
    private recipient: CruxId;
    private eventSocket: IGatewayEventSocket;

    constructor(protocolHandler: IGatewayProtocolHandler, transport: ICruxGatewayTransport, recipient: CruxId, sender?: IGatewayMessageSender) {
        // const that = this;
        this.sender = sender;
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
