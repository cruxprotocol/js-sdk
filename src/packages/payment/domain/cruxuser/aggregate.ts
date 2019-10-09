import { IntegrationEventer } from "../../shared-kernel/eventer";
import { IMessage, IPaymentData, IPublicKey, IUserID } from "../../shared-kernel/interfaces";
import { Address, Message, MESSAGE_TYPE } from "../../shared-kernel/models";

export class CruxUser {

    private _addresses: [Address] | undefined;
    private _publicKey: IPublicKey;

    constructor(publicKey: IPublicKey, addresses: [Address] | undefined) {
        this._publicKey = publicKey;
        this._addresses = addresses;
    }

    public getAddresses() {
        return this._addresses;
    }

    public getPublicKey() {
        return this._publicKey;
    }

    public requestPayment(paymentRequest: IPaymentData, requester: IUserID, requestee: IUserID) {
        // TODO: requester should be a present globally as current user
        const messageProps: IMessage = { type: MESSAGE_TYPE.REQUEST_PAYMENT, from: requester, to: requestee, data: paymentRequest };
        const requestPaymentMessage = new Message(messageProps);
        IntegrationEventer.getInstance().emit(MESSAGE_TYPE.REQUEST_PAYMENT, requestPaymentMessage);
    }
}
