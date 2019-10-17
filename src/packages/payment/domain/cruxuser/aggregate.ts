import { IntegrationEventer } from "../../shared-kernel/eventer";
import { IMessage, IPaymentData, IPublicKey, IUserID } from "../../shared-kernel/interfaces";
import { Address, Message, MESSAGE_TYPE, UserId } from "../../shared-kernel/models";
import { CruxUserProfile } from "./cruxuserprofile";

export class CruxUser {

    public userId: IUserID;

    constructor(userID: IUserID, publicKey: IPublicKey, addresses: [Address] | undefined) {
        IntegrationEventer.getInstance().on("request_payment_recieved", (data) => {
            console.log(`payment request recieved:- ${data}`);
        });

        this.userId = new UserId(userID);
    }

    public sendPaymentRequest(paymentRequest: IPaymentData, to: CruxUserProfile) {
        // TODO: requester should be a present globally as current user
        const requester: IUserID = this.userId;
        const requestee: IUserID = to.userId;
        const messageProps: IMessage = { type: MESSAGE_TYPE.REQUEST_PAYMENT, from: requester, to: requestee, data: paymentRequest, signature: undefined };
        const requestPaymentMessage = new Message(messageProps);
        IntegrationEventer.getInstance().emitMessage("request_payment", requestPaymentMessage);
    }
}
