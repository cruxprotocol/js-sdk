import { publicKeyToAddress, uploadToGaiaHub, wrapProfileToken } from "blockstack";
import { IKeyManager } from "../../core/interfaces/key-manager";
import { getLogger } from "../../packages/logger";
import { getRandomHexString } from "../../packages/utils";

const log = getLogger(__filename);

export class GaiaService {
    public gaiaWriteUrl: string;

    constructor(gaiaWriteUrl: string) {
        this.gaiaWriteUrl = gaiaWriteUrl;
    }

    public uploadContentToGaiaHub = async (filename: string, content: any, keyManager: IKeyManager, type = "application/json"): Promise<string> => {
        const hubURL = this.gaiaWriteUrl;
        const hubConfigPromise = this._connectToGaiaHubAsync(hubURL, keyManager);
        const tokenFilePromise = this._generateContentTokenFileAsync(content, keyManager);
        const [hubConfig, tokenFile] = await Promise.all([hubConfigPromise, tokenFilePromise]);
        const contentToUpload: string = JSON.stringify(tokenFile);
        return uploadToGaiaHub(filename, contentToUpload, hubConfig, type);
    }

    private _connectToGaiaHubAsync = async (hubURL: string, keyManager: IKeyManager, associationToken?: string) => {
        log.debug(`connectToGaiaHub: ${hubURL}/hub_info`);
        const response = await this._fetchPrivate(`${hubURL}/hub_info`);
        const hubInfo = await response.json();
        const readURL = hubInfo.read_url_prefix;
        const token = await this._makeV1GaiaAuthTokenAsync(hubInfo, hubURL, keyManager, associationToken);
        const address = publicKeyToAddress(await keyManager.getPubKey());
        return {
            address,
            server: hubURL,
            token,
            url_prefix: readURL,
        };
    }

    private _makeV1GaiaAuthTokenAsync = async (hubInfo: any, hubURL: string, keyManager: IKeyManager, associationToken?: string) => {
        const challengeText = hubInfo.challenge_text;
        const handlesV1Auth = (hubInfo.latest_auth_version && parseInt(hubInfo.latest_auth_version.slice(1), 10) >= 1);
        const iss = await keyManager.getPubKey();
        if (!handlesV1Auth) {
            // todo
            // return this._makeLegacyAuthToken(challengeText, keyManager);
        }
        const salt = getRandomHexString(16).toLocaleLowerCase();
        const payload = {
            // associationToken,
            gaiaChallenge: challengeText,
            hubUrl: hubURL,
            iss,
            salt,
        };
        const token = await keyManager.signWebToken(payload);
        return `v1:${token}`;
    }

    private _fetchPrivate = async (input: RequestInfo, init?: RequestInit) => {
        init = init || {};
        init.referrerPolicy = "no-referrer";
        return fetch(input, init);
    }

    private _generateContentTokenFileAsync = async (content: any, keyManager: IKeyManager) => {
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
