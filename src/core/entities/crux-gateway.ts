// @ts-ignore
// @ts-ignore

import {CruxId} from "../../packages";
import {ICruxGatewayTransport, IGatewayIdentityClaim, IGatewayProtocolHandler} from "../interfaces";

export enum EventBusEventNames {
    newMessage = "newMessage",
}

export class CruxGateway {

    private protocolHandler: IGatewayProtocolHandler;
    private transport: ICruxGatewayTransport;
    private messageListener: (message: any) => void;
    private selfClaim?: IGatewayIdentityClaim;

    constructor(protocolHandler: IGatewayProtocolHandler, transport: ICruxGatewayTransport, selfClaim?: IGatewayIdentityClaim) {
        // const that = this;
        this.selfClaim = selfClaim;
        this.transport = transport;
        this.messageListener = (message) => undefined;
        this.protocolHandler = protocolHandler;
    }

    public sendMessage(recipient: CruxId, message: any) {
        this.protocolHandler.validateMessage(message);
        const eventBus = this.transport.connect(recipient);
        eventBus.send(message);
    }

    public listen(messageListener: (message: any) => void, errorListener?: (message: any) => void) {
        if (!this.selfClaim) {
            throw Error("Cannot listen to a gateway with no selfClaim");
        }
        const eventBus = this.transport.connect();
        eventBus.on(EventBusEventNames.newMessage, (foo: any) => {
            this.protocolHandler.validateMessage(foo);
            messageListener(foo);
        });
    }
}
