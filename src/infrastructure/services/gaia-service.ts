import { publicKeyToAddress, wrapProfileToken } from "blockstack";
import { IKeyManager } from "../../core/interfaces/key-manager";
import { BaseError } from "../../packages/error";
import { getLogger } from "../../packages/logger";
import { getRandomHexString, httpJSONRequest } from "../../packages/utils";
const log = getLogger(__filename);
export class GaiaService {
    public gaiaWriteUrl: string;
    constructor(gaiaWriteUrl: string) {
        this.gaiaWriteUrl = gaiaWriteUrl;
    }
    public uploadContentToGaiaHub = async (filename: string, content: any, keyManager: IKeyManager, type = "application/json"): Promise<string> => {
        const hubURL = this.gaiaWriteUrl;
        const hubConfigPromise = this.connectToGaiaHubAsync(hubURL, keyManager);
        const tokenFilePromise = this.generateContentTokenFileAsync(content, keyManager);
        const [hubConfig, tokenFile] = await Promise.all([hubConfigPromise, tokenFilePromise]);
        const contentToUpload: string = JSON.stringify(tokenFile);
        return this.uploadToGaiaHub(filename, contentToUpload, hubConfig, type);
    }
    private uploadToGaiaHub = async (filename: string, contents: string, hubConfig: any, contentType = "application/octet-stream") => {
        log.debug(`uploadToGaiaHub: uploading ${filename} to ${hubConfig.server}`);
        const options = {
            baseUrl: hubConfig.server,
            body: JSON.parse(contents),
            headers: {
                "Authorization": `bearer ${hubConfig.token}`,
                "Content-Type": contentType,
            },
            method: "POST",
            url: `/store/${hubConfig.address}/${filename}`,
        };
        console.log(options);
        let response: any;
        try {
            response = await httpJSONRequest(options);
        } catch (error) {
            throw new BaseError(error, "Error when uploading to Gaia hub");
        }
        return response.publicURL;
    }
    private connectToGaiaHubAsync = async (hubURL: string, keyManager: IKeyManager, associationToken?: string) => {
        log.debug(`connectToGaiaHub: ${hubURL}/hub_info`);
        const hubInfo: any = await httpJSONRequest({baseUrl: hubURL, url: `/hub_info`});
        const readURL = hubInfo.read_url_prefix;
        const token = await this.makeV1GaiaAuthTokenAsync(hubInfo, hubURL, keyManager, associationToken);
        const address = publicKeyToAddress(await keyManager.getPubKey());
        return {
            address,
            server: hubURL,
            token,
            url_prefix: readURL,
        };
    }
    private makeV1GaiaAuthTokenAsync = async (hubInfo: any, hubURL: string, keyManager: IKeyManager, associationToken?: string) => {
        const challengeText = hubInfo.challenge_text;
        const handlesV1Auth = (hubInfo.latest_auth_version && parseInt(hubInfo.latest_auth_version.slice(1), 10) >= 1);
        const iss = await keyManager.getPubKey();
        if (!handlesV1Auth) {
            // TODO: return this._makeLegacyAuthToken(challengeText, keyManager);
        }
        const salt = getRandomHexString(16).toLocaleLowerCase();
        const payload = {
            associationToken,
            gaiaChallenge: challengeText,
            hubUrl: hubURL,
            iss,
            salt,
        };
        const token = await keyManager.signWebToken(payload);
        return `v1:${token}`;
    }
    private generateContentTokenFileAsync = async (content: any, keyManager: IKeyManager) => {
        const publicKey = await keyManager.getPubKey();
        const payload = {
            claim: content,
            issuer: { publicKey },
            subject: { publicKey },
        };
        const token = await keyManager.signWebToken(payload);
        return [wrapProfileToken(token)];
    }
}
