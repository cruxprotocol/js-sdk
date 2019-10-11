import { IAddress, IMessage, IPublicKey, IUserID, IMessageData } from "./interfaces";
import { ValueObject } from "./value-object";
import { IdTranslator, BlockstackId, CruxId } from "../../identity-utils";

export enum KEY_TYPE {
    PUBLIC_KEY = "PublicKey",
    PRIVATE_KEY = "PrivateKey",
}

export enum KEY_ENCODING {
    HEX = "hex",
    BASE58 = "base58",
}

export enum MESSAGE_TYPE {
    REQUEST_PAYMENT =  "request_payment",
}

export class Address extends ValueObject<IAddress> {
    public readonly assetId: string;
    public readonly address: string;
    public readonly tag: string;
    public readonly encoding: string;

    constructor(props: IAddress) {
        super(props);
        this.assetId = props.assetId;
        this.address = props.address;
        this.tag = props.tag;
        this.encoding = props.encoding;
        this.validate();
    }

    public validate() {
        if (this.assetId && this.address && this.tag) {
            return true;
        }
        return false;
    }
}

export class Message extends ValueObject<IMessage> {
    public readonly type: string;
    public readonly from: IUserID;
    public readonly to: IUserID;
    public readonly data: IMessageData;

    constructor(props: IMessage) {
        super(props);
        this.type = props.type;
        this.from = props.from;
        this.to = props.to;
        this.data = props.data;
    }

    public validate() {
        if (this.type && this.from && this.to && this.data) {
            return true;
        }
        return false;
    }
}

export class UserId extends ValueObject<IUserID> {

    public readonly cruxIdentifier: string;
    public readonly cruxId: CruxId;
    public readonly blockstackId: BlockstackId;

    constructor(props: IUserID) {
        super(props);
        this.cruxIdentifier = props.cruxIdentifier;
        const splitted = props.cruxIdentifier.split(".")[0].split("@");
        this.cruxId = new CruxId({domain: splitted[1], subdomain: splitted[0]});
        this.blockstackId = new BlockstackId({domain: splitted[1], subdomain: splitted[0]});
    }

    public validate() {
        if (this.cruxIdentifier && this.cruxId && this.blockstackId) {
            return true;
        }
        return false;
    }

    public getCruxID() {
        return this.cruxId;
    }

    public getBlockstackID() {
        return this.blockstackId;
    }
}

export class PublicKey extends ValueObject<IPublicKey> {
    public readonly key: string;
    public readonly type: string;
    public readonly encoding: string;

    constructor(props: IPublicKey) {
        super(props);
        this.key = props.key;
        this.type = props.type;
        this.encoding = props.encoding;
        this.validate();
    }

    public getPublicKey(): IPublicKey {
        return {key: this.key, type: this.type, encoding: this.encoding};
    }

    public validate() {
        if (this.key && this.type && this.encoding) {
            return true;
        }
        return false;
    }
}
