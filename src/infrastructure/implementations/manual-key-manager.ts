import { IKeyManager } from "../../core/interfaces/key-manager";
import { getLogger } from "../../packages/logger";
const log = getLogger(__filename);
export class ManualKeyManager implements IKeyManager {
    private _publicKey: string;
    private _signWebTokenCallback: (payload: any) => Promise<string>;
    constructor(publicKey: string, signWebTokenCallback: (payload: any) => Promise<string>) {
        this._signWebTokenCallback = signWebTokenCallback;
        this._publicKey = publicKey;
        log.info("ManualKeyManager initialised");
    }
    public signWebToken = async (payload: any): Promise<string> => {
        return this._signWebTokenCallback(payload);
    }
    public getPubKey = async (): Promise<string> => {
        return this._publicKey;
    }
}
