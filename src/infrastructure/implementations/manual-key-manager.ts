import { IKeyManager } from "../../core/interfaces/key-manager";
import { getLogger } from "../../packages/logger";
const log = getLogger(__filename);
export class ManualKeyManager implements IKeyManager {
    private publicKey: string;
    private signWebTokenCallback: (payload: any) => Promise<string>;
    constructor(publicKey: string, signWebTokenCallback: (payload: any) => Promise<string>) {
        this.signWebTokenCallback = signWebTokenCallback;
        this.publicKey = publicKey;
        log.debug("ManualKeyManager initialised");
    }
    public signWebToken = async (payload: any): Promise<string> => {
        return this.signWebTokenCallback(payload);
    }
    public getPubKey = async (): Promise<string> => {
        return this.publicKey;
    }
}
