import * as blockstack from "blockstack";
import { SECP256K1Client, TokenSigner } from "jsontokens";
import { getLogger } from "..";
import { ErrorHelper, PackageErrorCode } from "./error";
import * as nameservice from "./nameservice";
import { UPLOADABLE_JSON_FILES } from "./nameservice";

const log = getLogger(__filename);

export class GaiaService {
    public gaiaWriteUrl: string;

    constructor(gaiaWriteUrl: string) {
        this.gaiaWriteUrl = gaiaWriteUrl;
    }

    public uploadContentToGaiaHub = async (filename: UPLOADABLE_JSON_FILES, privKey: string, content: any, type= "application/json"): Promise<string> => {
        const sanitizedPrivKey = this._sanitizePrivKey(privKey);
        const hubURL = this.gaiaWriteUrl;
        const hubConfig = await blockstack.connectToGaiaHub(hubURL, sanitizedPrivKey);
        const tokenFile = this._generateTokenFileForContent(sanitizedPrivKey, content);
        let contentToUpload: any;
        contentToUpload = JSON.stringify(tokenFile);
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

    public uploadProfileInfo = async (privKey: string): Promise<boolean> => {
        // TODO: validate the privateKey format and convert
        privKey = this._sanitizePrivKey(privKey);

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
        return true;
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

    private _sanitizePrivKey = (privKey: string): string => {
        if (privKey.length === 66 && privKey.slice(64) === "01") {
            privKey = privKey.slice(0, 64);
        }
        return privKey;
    }
}
