export interface IAddress {
    readonly assetId: string;
    readonly address: string;
    readonly tag: string;
    readonly encoding: string;
}

export interface IMessage {
    readonly type: string;
    readonly from: string;
    readonly to: string;
    readonly data: JSON;
}

export interface IUserID {
    readonly subdomain: string;
    readonly domain: string;
}

export interface IPublicKey {
    readonly key: string;
    readonly type: string;
    readonly encoding: string;
}

export interface IPaymentData {
    readonly assetID: string;
    readonly amount: number;
    readonly address: IAddress;
    readonly requestee: IUserID;
}
