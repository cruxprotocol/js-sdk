import { decodeToken, publicKeyToAddress, verifyProfileToken, wrapProfileToken } from "blockstack";
import { IKeyManager } from "../../core/interfaces/key-manager";
import { ErrorHelper, PackageErrorCode } from "../../packages/error";
import { getLogger } from "../../packages/logger";
import { StorageService } from "../../packages/storage";
import { getRandomHexString, sanitizeUrl } from "../../packages/utils";
import { GaiaServiceApiClient, IHubInfo } from "./api-clients";
const log = getLogger(__filename);
export interface IHubConfig {
    address: string;
    server: string;
    token: string;
    url_prefix: any;
}
export interface IGaiaDetails {
    gaiaReadUrl: string;
    gaiaWriteUrl: string;
    ownerAddress: string;
}
export class GaiaService {
    public static getGaiaReadUrl = async (gaiaHub: string, cacheStorage?: StorageService): Promise<string> => {
        const hubInfo = await GaiaServiceApiClient.getHubInfo(gaiaHub, cacheStorage);
        return hubInfo.read_url_prefix;
    }
    public static getContentFromGaiaHub = async (readUrlPrefix: string, address: string, filename: string, cacheStorage?: StorageService): Promise<any> => {
        const responseBody = await GaiaServiceApiClient.retrieve(readUrlPrefix, filename, address, cacheStorage);
        if (responseBody.indexOf("BlobNotFound") > 0 || responseBody.indexOf("NoSuchKey") > 0) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.GaiaEmptyResponse);
        }
        const decodedToken: any = decodeToken(responseBody[0].token);
        const content = decodedToken.payload.claim;
        const pubKey = decodedToken.payload.subject.publicKey;
        const addressFromPub = publicKeyToAddress(pubKey);
        // validate the file integrity with the token signature
        try {
            verifyProfileToken(responseBody[0].token, pubKey);
        } catch (e) {
            // TODO: validate the token properly after publishing the subject
            log.error(e);
            throw ErrorHelper.getPackageError(e, PackageErrorCode.GaiaRecordIntegrityFailed, filename, address);
        }
        if (addressFromPub !== address) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.GaiaRecordIntegrityFailed, filename, address);
        }
        return content;
    }
    private cacheStorage?: StorageService;
    private gaiaHub: string;
    constructor(gaiaHub: string, cacheStorage?: StorageService) {
        this.cacheStorage = cacheStorage;
        this.gaiaHub = gaiaHub;
    }
    public getContentFromGaiaHub = async (address: string, filename: string): Promise<any> => {
        const hubInfo: IHubInfo = await GaiaServiceApiClient.getHubInfo(this.gaiaHub, this.cacheStorage);
        const readURL = sanitizeUrl(hubInfo.read_url_prefix);
        return GaiaService.getContentFromGaiaHub(readURL, address, filename, this.cacheStorage);
    }
    public uploadContentToGaiaHub = async (filename: string, content: any, keyManager: IKeyManager, type = "application/json"): Promise<string> => {
        const hubConfigPromise = this.connectToGaiaHubAsync(keyManager);
        const tokenFilePromise = this.generateContentTokenFileAsync(content, keyManager);
        const [hubConfig, tokenFile] = await Promise.all([hubConfigPromise, tokenFilePromise]);
        const contentToUpload: string = JSON.stringify(tokenFile);
        const response = await GaiaServiceApiClient.store(this.gaiaHub, filename, hubConfig.address, hubConfig.token, contentToUpload, type);
        return response.publicURL;
    }
    private connectToGaiaHubAsync = async (keyManager: IKeyManager, associationToken?: string) => {
        log.debug(`connectToGaiaHub: ${this.gaiaHub}/hub_info`);
        const hubInfo: IHubInfo = await GaiaServiceApiClient.getHubInfo(this.gaiaHub, this.cacheStorage);
        const readURL = sanitizeUrl(hubInfo.read_url_prefix);
        const token = await this.makeV1GaiaAuthTokenAsync(hubInfo, keyManager, associationToken);
        const address = publicKeyToAddress(await keyManager.getPubKey());
        return {
            address,
            server: this.gaiaHub,
            token,
            url_prefix: readURL,
        };
    }
    private makeV1GaiaAuthTokenAsync = async (hubInfo: any, keyManager: IKeyManager, associationToken?: string) => {
        const challengeText = hubInfo.challenge_text;
        const handlesV1Auth = (hubInfo.latest_auth_version && parseInt(hubInfo.latest_auth_version.slice(1), 10) >= 1);
        const iss = await keyManager.getPubKey();
        if (!handlesV1Auth) {
            // TODO: return this._makeLegacyAuthToken(challengeText, keyManager);
        }
        const salt = getRandomHexString(16).toLocaleLowerCase();
        const exp = (Date.now() / 1000) + 300;  // token validity buffer time (5 minutes)
        const payload = {
            associationToken,
            exp,
            gaiaChallenge: challengeText,
            hubUrl: this.gaiaHub,
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
