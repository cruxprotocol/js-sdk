import { IMessage, IPublicKey } from "../../shared-kernel/interfaces";
import { Address } from "../../shared-kernel/models";

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

    public requestPayment(message: IMessage) {
        // invoke this if you want to request money from this CruxUser
        // should emit an event that is consumed by message processor
    }
}
