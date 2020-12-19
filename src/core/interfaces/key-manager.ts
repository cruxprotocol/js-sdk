export interface IKeyManager {
    signWebToken: (payload: any) => Promise<string>;
    getPubKey: () => Promise<string>;
    deriveSharedSecret?: (publicKey: string) => Promise<string>;
    decryptMessage?: (encryptedMessage: string) => Promise<string>;
    symmetricEncrypt?: (content: object) => Promise<string>;
    symmetricDecrypt?: (encryptedContent: string) => Promise<object>;
}

export const isInstanceOfKeyManager = (object: any) => {
    if ("getPubKey" in object && typeof object.getPubKey === "function" && "signWebToken" in object && typeof object.signWebToken === "function") {
        return true;
    } else {
        return false;
    }
};
