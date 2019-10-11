import { CruxUser } from "open_pay_sdk/src/packages/payment/domain/cruxuser/aggregate";
import { IntegrationEventer } from "../../shared-kernel/eventer";
import { IMessage, IPaymentData, IPublicKey, IUserID } from "../../shared-kernel/interfaces";
import { Address, Message, MESSAGE_TYPE } from "../../shared-kernel/models";

export class CruxUserProfile {

    public userId: IUserID;
    private _addresses: [Address] | undefined;
    private _publicKey: IPublicKey;

    constructor(userID: IUserID, publicKey: IPublicKey, addresses: [Address] | undefined) {
        this._publicKey = publicKey;
        this._addresses = addresses;
        this.userId = userID;
    }

    public getAddresses() {
        return this._addresses;
    }

    public getPublicKey() {
        return this._publicKey;
    }
}
