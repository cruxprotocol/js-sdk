import * as blockstack from "blockstack";
import { SECP256K1Client, TokenSigner } from "jsontokens";
import { getLogger } from "../..";
import { sanitizePrivKey } from "../utils";

const log = getLogger(__filename);

export class GaiaService {
    public gaiaWriteUrl: string;

    constructor(gaiaWriteUrl: string) {
        this.gaiaWriteUrl = gaiaWriteUrl;
    }

    public uploadContentToGaiaHub = async (filename: string, privKey: string, content: any, type = "application/json"): Promise<string> => {
        const sanitizedPrivKey = sanitizePrivKey(privKey);
        const hubURL = this.gaiaWriteUrl;
        const hubConfig = await blockstack.connectToGaiaHub(hubURL, sanitizedPrivKey);
        const tokenFile = this._generateTokenFileForContent(sanitizedPrivKey, content);
        const contentToUpload: string = JSON.stringify(tokenFile);
        return await blockstack.uploadToGaiaHub(filename, contentToUpload, hubConfig, type);
    }

    private _generateTokenFileForContent(privateKey: string, content: any) {
        const publicKey = SECP256K1Client.derivePublicKey(privateKey);
        const tokenSigner = new TokenSigner("ES256K", privateKey);
        const payload = {
            claim: content,
            issuer: { publicKey },
            subject: { publicKey },
        };
        const token = tokenSigner.sign(payload);
        return [blockstack.wrapProfileToken(token)];
    }
}
