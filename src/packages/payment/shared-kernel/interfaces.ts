export interface IntAddress {
    readonly assetId: string;
    readonly address: string;
    readonly tag: string | undefined;
    readonly encoding: string;
}

export interface IMessage {
    readonly type: string;
    readonly from: IUserID;
    readonly to: IUserID;
    readonly data: IMessageData;
    readonly signature: string | undefined;
}

export interface IUserID {
    readonly cruxIdentifier: string;
}

export interface IPublicKey {
    readonly key: string;
    readonly type: string;
    readonly encoding: string;
}

export interface IMessageData {
    readonly requestee: IUserID;
}

export interface IPaymentData extends IMessageData {
    readonly assetID: string;
    readonly amount: number;
    readonly address: IntAddress;
}
