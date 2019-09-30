import * as blockstack from "blockstack";
import { SECP256K1Client, TokenSigner } from "jsontokens";
import { getLogger } from "..";
import * as Errors from "./errors";
import * as nameservice from "./nameservice";
import { httpJSONRequest } from "./utils";

const log = getLogger(__filename);

// export let getGaiaHubInstance = async (writeUrl: string) => {
//     const myGaiaHub = new GaiaService(writeUrl);
//     await myGaiaHub.init();
//     return myGaiaHub;
// };

export class GaiaService {
    private _gaiaWriteUrl: string;
    private _gaiaReadUrl: string | undefined;

    constructor(gaiaWriteUrl: string) {
        this._gaiaWriteUrl = gaiaWriteUrl;
    }

    public uploadContentToGaiaHub = async (filename: string, privKey: string, content: any, type= "application/json"): Promise<string> => {
        console.groupCollapsed("Uploading content to gaiaHub");
        const sanitizedPrivKey = this._sanitizePrivKey(privKey);
        const hubURL = this._gaiaWriteUrl;
        const hubConfig = await blockstack.connectToGaiaHub(hubURL, sanitizedPrivKey);
        const tokenFile = this._generateTokenFileForContent(sanitizedPrivKey, content);
        let contentToUpload: any = null;
        if (type === "application/json") {
            contentToUpload = JSON.stringify(tokenFile);
        } else {
            console.groupEnd();
            throw new Error(`Unhandled content-type ${type}`);
        }
        let finalURL: string;
        try {
            finalURL = await blockstack.uploadToGaiaHub(filename, contentToUpload, hubConfig, type);
            log.debug(`finalUrl is ${finalURL}`);
        } catch (error) {
            console.groupEnd();
            throw new Errors.ClientErrors.GaiaUploadFailed(`unable to upload to gaiahub, ${error}`, 2005);
        }
        console.groupEnd();
        return finalURL;
    }

    public uploadProfileInfo = async (privKey: string): Promise<boolean> => {
        // TODO: validate the privateKey format and convert
        privKey = this._sanitizePrivKey(privKey);

        const hubUrl = this._gaiaWriteUrl;
        const hubConfig = await blockstack.connectToGaiaHub(hubUrl, privKey);
        const profileObj = {
            "@context": "http://schema.org/",
            "@type": "Person",
        };
        const person = new blockstack.Person(profileObj);
        const token = person.toToken(privKey);
        log.debug(token);
        const tokenFile = [blockstack.wrapProfileToken(token)];
        log.debug(tokenFile);
        try {
            const finalUrl = await blockstack.uploadToGaiaHub("profile.json", JSON.stringify(tokenFile), hubConfig, "application/json");
            log.debug(finalUrl);
        } catch (e) {
            throw new Errors.ClientErrors.GaiaUploadFailed(`Unable to upload profile.json to gaiahub, ${e}`, 2006);
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
        const tokenFile = [blockstack.wrapProfileToken(token)];
        return tokenFile;
    }

    private _sanitizePrivKey = (privKey: string): string => {
        if (privKey.length === 66 && privKey.slice(64) === "01") {
            privKey = privKey.slice(0, 64);
        }
        return privKey;
    }

    private _getGaiaHubUrlsFromBlockstackID = async (blockstackId: string) => {
        console.groupCollapsed("Resolving gaiaHubUrls from BlockstackID");
        let nameData: any;
        try {
            nameData = await new nameservice.BlockstackService().fetchNameDetails(blockstackId);
        } catch (error) {
            console.groupEnd();
            throw error;
        }
        log.debug(nameData);
        if (!nameData) {
            console.groupEnd();
            throw new Error((`No name data availabe!`));
        }
        if (!nameData.address) {
            console.groupEnd();
            throw new Errors.ClientErrors.UserDoesNotExist("ID does not exist", 1037);
        }
        const bitcoinAddress = nameData.address;
        log.debug(`ID owner: ${bitcoinAddress}`);
        let gaiaHub: string | undefined;
        if (!nameData.zonefile.match(new RegExp("(.+)https:\/\/(.+)\/profile.json"))) {
            // gaiaRead = "https://" + nameData.zonefile.match(new RegExp("(.+)https:\/\/(.+)\/profile.json", "s"))[2] + "/";
            gaiaHub = nameData.zonefile.match(new RegExp("https:\/\/(.+)")).slice(0, -1);
        }
        return {
            gaiaWriteUrl: gaiaHub,
            ownerAddress: bitcoinAddress,
        };
    }
}
