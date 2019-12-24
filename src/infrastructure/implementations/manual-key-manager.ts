import { PubkeyHashSigner } from "blockstack";
import { TokenSigner } from "jsontokens";
import { IKeyManager } from "../../domain-entities";
import { getLogger } from "../../packages/logger";
import { getKeyPairFromPrivKey } from "../../packages/utils";

const log = getLogger(__filename);

export class ManualKeyManager implements IKeyManager {
    private _privateKey: string;
    private _publicKey: string;

    constructor(privateKey: string) {
        const keyPair = getKeyPairFromPrivKey(privateKey);
        this._privateKey = keyPair.privKey;
        this._publicKey = keyPair.pubKey;
        log.info("ManualKeyManager initialised");
    }

    public signWebToken = async (payload: any): Promise<string> => {
        const signedMsg = new TokenSigner("ES256K", this._privateKey).sign(payload);
        return signedMsg;
    }
    public getPubKey = async (): Promise<string> => {
        return this._publicKey;
    }

    public pubKeyHashSigner = async (): Promise<PubkeyHashSigner> => {
        return PubkeyHashSigner.fromHexString(this._privateKey);
    }
}