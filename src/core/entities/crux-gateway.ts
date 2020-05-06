import {CruxId} from "../../packages";
import {IKeyManager} from "../interfaces";

export interface IGatewayMessageSender {
    cruxId?: CruxId;
    keyManager?: IKeyManager;
}
export interface IGatewayProtocolHandler {
    getName(): string;

    validateMessage(gatewayMessage: any): boolean;
}

export interface ICruxGatewayTransport {
    listen(messageListener: (message: any) => void): void;

    send(message: any, recipient: CruxId, sender: ): void;
}

export class CruxGateway {

    private protocolHandler: IGatewayProtocolHandler;
    private transport: ICruxGatewayTransport;
    private messageListener: (message: any) => void;
    private sender?: IGatewayMessageSender;
    private recipient: CruxId;
    private eventBus: any;

    constructor(protocolHandler: IGatewayProtocolHandler, transport: ICruxGatewayTransport, recipient: CruxId, sender?: IGatewayMessageSender) {
        const that = this;
        this.sender = sender;
        this.recipient = recipient;
        this.messageListener = (message) => undefined;
        this.protocolHandler = protocolHandler;

        this.eventBus = transport.getEventBus()
        this.eventBus.listen((foo: any) => {
            that.protocolHandler.validateMessage(foo);
            that.messageListener(foo);
        });
    }

    public sendMessage(message: any) {
        this.protocolHandler.validateMessage(message);

        this.transport.send(message, this.recipient, this.sender)
        this.transport.emit(this.recipient, message);
    }

    public listen(messageListener: (message: any) => void) {
        this.messageListener = messageListener;
    }
}
