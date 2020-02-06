export interface IKeyManager {
    signWebToken: (payload: any) => Promise<string>;
    getPubKey: () => Promise<string>;
}

export const isInstanceOfKeyManager = (object: any) => {
    if ("getPubKey" in object && typeof object.getPubKey === "function" && "signWebToken" in object && typeof object.signWebToken === "function") {
        return true;
    } else {
        return false;
    }
};
