import {send} from "q";
import {
    CruxGateway,
    ICruxGatewayTransport,
    IGatewayMessageSender,
    IGatewayProtocolHandler,
} from "../../core/entities/crux-gateway";
import {
    ICruxGatewayRepository,
    ICruxGatewayRepositoryRepositoryOptions,
} from "../../core/interfaces/crux-gateway-repository";
import {CruxId} from "../../packages";
import {IBlockstackCruxUserRepositoryOptions} from "./blockstack-crux-user-repository";

export class PlainTextGatewayProtocolHandler implements IGatewayProtocolHandler {
    public getName(): string {
        return "PLAIN_TEXT";
    }

    public validateMessage(gatewayMessage: any): boolean {
        return true;
    }
}

export class PaymentRequestGatewayProtocolHandler implements IGatewayProtocolHandler {
    public getName(): string {
        return "PAYMENT_REQUEST";
    }

    public validateMessage(gatewayMessage: any): boolean {
        return true;
    }
}

export class StrongPubsubGatewayTransport implements ICruxGatewayTransport {
    // tslint:disable-next-line:no-empty
    public listen(messageListener: (message: any) => void): void {
    }

    // tslint:disable-next-line:no-empty
    public send(recipient: CruxId, message: any): void {
    }
}

const protocolHandlers = [PlainTextGatewayProtocolHandler, PaymentRequestGatewayProtocolHandler];

class IProtocolHandlerMapping {
    [protocolName: string]: IGatewayProtocolHandler;
}

const protocolHandlerByName: IProtocolHandlerMapping = {};
protocolHandlers.forEach( (protocolHandler: any) => {
    protocolHandlerByName[protocolHandler.getName()] = protocolHandler;
});

const getProtocolHandler = (gatewayProtocol: string): IGatewayProtocolHandler => {
    // handle error
    return protocolHandlerByName[gatewayProtocol];
};

const getDefaultTransportClass = (): any => {
    // handle error
    return StrongPubsubGatewayTransport;
};

export class CruxGatewayRepository implements ICruxGatewayRepository {
    private protocolHandler: IGatewayProtocolHandler;
    private transport: ICruxGatewayTransport;
    constructor(options: ICruxGatewayRepositoryRepositoryOptions) {
        this.protocolHandler = getProtocolHandler(options.messageProtocol);
        const transportClass = getDefaultTransportClass();
        this.transport = new transportClass();
    }
    public get(recipient: CruxId, sender?: IGatewayMessageSender): CruxGateway {
        return new CruxGateway(this.protocolHandler, this.transport, recipient, sender);
    }

}
