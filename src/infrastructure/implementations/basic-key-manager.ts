import { TokenSigner } from "jsontokens";
import { IKeyManager } from "../../core/interfaces/key-manager";
import { getLogger } from "../../packages/logger";
import { getKeyPairFromPrivKey } from "../../packages/utils";
const log = getLogger(__filename);
export class BasicKeyManager implements IKeyManager {
    private privateKey: string;
    private publicKey: string;
    constructor(privateKey: string) {
        const keyPair = getKeyPairFromPrivKey(privateKey);
        this.privateKey = keyPair.privKey;
        this.publicKey = keyPair.pubKey;
        log.info("BasicKeyManager initialised");
    }
    public signWebToken = async (payload: any): Promise<string> => {
        const signedMsg = new TokenSigner("ES256K", this.privateKey).sign(payload);
        return signedMsg;
    }
    public getPubKey = async (): Promise<string> => {
        return this.publicKey;
    }
}
