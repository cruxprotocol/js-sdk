import { IAddress, IMessage, IPublicKey, IUserID } from "./interfaces";
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
    MAKE_PAYMENT = "make_payment",
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
    public readonly from: string;
    public readonly to: string;
    public readonly data: JSON;

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
    public readonly domain: string;
    public readonly subdomain: string;
    public readonly blockstackId: BlockstackId;
    public readonly cruxId: CruxId;

    constructor(props: IUserID) {
        super(props);
        this.domain = props.domain;
        this.subdomain = props.subdomain;
        this.blockstackId = new BlockstackId({domain: this.domain, subdomain: this.subdomain});
        this.cruxId = new CruxId({domain: this.domain,subdomain: this.subdomain });
    }

    public validate() {
        if (this.userId) {
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
