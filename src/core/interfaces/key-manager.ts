export interface IKeyManager {
    signWebToken: (payload: any) => Promise<string>;
    getPubKey: () => Promise<string>;
}
