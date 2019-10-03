import * as blockstack from "blockstack";
import { SECP256K1Client, TokenSigner } from "jsontokens";
import { getLogger } from "../..";
import { ErrorHelper, PackageErrorCode } from "../error";
import * as nameservice from "../name-service/blockstack-service";
import { UPLOADABLE_JSON_FILES } from "../name-service/blockstack-service";
import { sanitizePrivKey } from "../utils";

const log = getLogger(__filename);

export class GaiaService {
    public gaiaWriteUrl: string;

    constructor(gaiaWriteUrl: string) {
        this.gaiaWriteUrl = gaiaWriteUrl;
    }

    public uploadContentToGaiaHub = async (filename: UPLOADABLE_JSON_FILES, privKey: string, content: any, type= "application/json"): Promise<string> => {
        const sanitizedPrivKey = sanitizePrivKey(privKey);
        const hubURL = this.gaiaWriteUrl;
        const hubConfig = await blockstack.connectToGaiaHub(hubURL, sanitizedPrivKey);
        const tokenFile = this._generateTokenFileForContent(sanitizedPrivKey, content);
        const contentToUpload: any = JSON.stringify(tokenFile);
        let finalURL: string;
        try {
            finalURL = await blockstack.uploadToGaiaHub(filename, contentToUpload, hubConfig, type);
            log.debug(`finalUrl is ${finalURL}`);
        } catch (error) {
            const packageErrorCode = nameservice.BlockstackService.getUploadPackageErrorCodeForFilename(filename);
            throw ErrorHelper.getPackageError(packageErrorCode, filename, error);
        }
        return finalURL;
    }

    public uploadProfileInfo = async (privKey: string): Promise<void> => {
        // TODO: validate the privateKey format and convert
        privKey = sanitizePrivKey(privKey);

        const hubUrl = this.gaiaWriteUrl;
        const hubConfig = await blockstack.connectToGaiaHub(hubUrl, privKey);
        const profileObj = {
            "@context": "http://schema.org/",
            "@type": "Person",
        };
        const filename = UPLOADABLE_JSON_FILES.PROFILE;
        const person = new blockstack.Person(profileObj);
        const token = person.toToken(privKey);
        log.debug(token);
        const tokenFile = [blockstack.wrapProfileToken(token)];
        log.debug(tokenFile);
        try {
            const finalUrl = await blockstack.uploadToGaiaHub(filename, JSON.stringify(tokenFile), hubConfig, "application/json");
            log.debug(finalUrl);
        } catch (error) {
            throw ErrorHelper.getPackageError(PackageErrorCode.GaiaProfileUploadFailed, filename, error);
        }
        return;
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
