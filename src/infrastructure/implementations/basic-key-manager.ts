// @ts-ignore
import * as eccrypto from "eccrypto";
import { ec } from "elliptic";
import { TokenSigner } from "jsontokens";
import { IKeyManager } from "../../core/interfaces/key-manager";
import { Encryption } from "../../packages/encryption";
import { getLogger } from "../../packages/logger";
import { getKeyPairFromPrivKey, getRandomHexString } from "../../packages/utils";
const log = getLogger(__filename);
export class BasicKeyManager implements IKeyManager {
    private getEncryptionKey?: () => Promise<string>;
    private ephemeralEncryptionConstant?: string;
    private encryptedPrivateKey!: string;
    private publicKey!: string;
    private initPromise: Promise<void>;
    constructor(privateKey: string, getEncryptionKey?: () => Promise<string>) {
        this.initPromise = this.init(privateKey, getEncryptionKey);
        log.debug("BasicKeyManager initialised");
    }
    public signWebToken = async (payload: any): Promise<string> => {
        await this.initPromise;
        let privateKey = await this.getDecryptedPrivateKey();
        const signedMsg = new TokenSigner("ES256K", privateKey).sign(payload);
        privateKey = "0".repeat(privateKey.length);
        return signedMsg;
    }
    public getPubKey = async (): Promise<string> => {
        await this.initPromise;
        return this.publicKey;
    }
    public deriveSharedSecret = async (publicKey: string): Promise<string> => {
        let privateKey = await this.getDecryptedPrivateKey();
        const curve = new ec("secp256k1");
        const selfKey = curve.keyFromPrivate(privateKey, "hex");
        const userKey = curve.keyFromPublic(publicKey, "hex");
        privateKey = "0".repeat(privateKey.length);
        return selfKey.derive(userKey.getPublic()).toString(16);
    }

    public decryptMessage = async (encryptedMessage: string): Promise<string> => {
        const privateKey = await this.getDecryptedPrivateKey();
        const decrypted = await eccrypto.decrypt(Buffer.from(privateKey, "hex"), encryptedMessage);
        return decrypted.toString();
    }
    private init = async (privateKey: string, getEncryptionKey?: () => Promise<string>): Promise<void> => {
        let encryptionConstant: string;
        if (getEncryptionKey) {
            encryptionConstant = await getEncryptionKey();
            this.getEncryptionKey = getEncryptionKey;
        } else {
            encryptionConstant = getRandomHexString();
            this.ephemeralEncryptionConstant = encryptionConstant;
        }
        const keyPair = getKeyPairFromPrivKey(privateKey);
        this.publicKey = keyPair.pubKey;
        this.encryptedPrivateKey = JSON.stringify(await Encryption.encryptText(keyPair.privKey, encryptionConstant));
        privateKey = "0".repeat(privateKey.length);
    }
    private getDecryptedPrivateKey = async (): Promise<string> => {
        await this.initPromise;
        let encryptionConstant: string;
        if (this.getEncryptionKey) {
            encryptionConstant = await this.getEncryptionKey();
        } else {
            // assume that there is ephemeralEncryptionConstant set as fallback
            encryptionConstant = this.ephemeralEncryptionConstant!;
        }
        const encryptedPrivateKeyObject: { encBuffer: string, iv: string } = JSON.parse(this.encryptedPrivateKey);
        return Encryption.decryptText(encryptedPrivateKeyObject.encBuffer, encryptedPrivateKeyObject.iv, encryptionConstant);
    }
}
