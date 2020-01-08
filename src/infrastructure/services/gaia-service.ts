import { publicKeyToAddress, verifyProfileToken, wrapProfileToken } from "blockstack";
import { ICruxBlockstackInfrastructure } from "../../core/interfaces";
import { IKeyManager } from "../../core/interfaces/key-manager";
import { ErrorHelper, PackageErrorCode } from "../../packages/error";
import { getLogger } from "../../packages/logger";
import { StorageService } from "../../packages/storage";
import { getRandomHexString } from "../../packages/utils";
import { BlockstackService } from "../services/blockstack-service";
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
    public static getContentFromGaiaHub = async (blockstackId: string, filename: string, bnsNodes: string[], tag?: string, cacheStorage?: StorageService): Promise<any> => {
        const gaiaDetails = await GaiaService.getGaiaDataFromBlockstackID(blockstackId, bnsNodes, tag, cacheStorage);
        const responseBody = await GaiaServiceApiClient.retrieve(gaiaDetails.gaiaReadUrl, filename, gaiaDetails.ownerAddress, cacheStorage);
        if (responseBody.indexOf("BlobNotFound") > 0 || responseBody.indexOf("NoSuchKey") > 0) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.GaiaEmptyResponse);
        }
        const content = responseBody[0].decodedToken.payload.claim;
        const pubKey = responseBody[0].decodedToken.payload.subject.publicKey;
        const addressFromPub = publicKeyToAddress(pubKey);
        // validate the file integrity with the token signature
        try {
            verifyProfileToken(responseBody[0].token, pubKey);
        } catch (e) {
            // TODO: validate the token properly after publishing the subject
            log.error(e);
            throw ErrorHelper.getPackageError(e, PackageErrorCode.TokenVerificationFailed, filename);
        }
        if (addressFromPub !== gaiaDetails.ownerAddress) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.CouldNotValidateZoneFile);
        }
        return content;
    }
    public static getGaiaDataFromBlockstackID = async (blockstackId: string, bnsNodes: string[], tag?: string, cacheStorage?: StorageService): Promise<IGaiaDetails> => {
        let nameData: any;
        nameData = BlockstackService.getNameDetails(blockstackId, bnsNodes, tag, cacheStorage);
        log.debug(nameData);
        if (!nameData) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.BnsEmptyData);
        }
        if (!nameData.address) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.UserDoesNotExist);
        }
        const bitcoinAddress = nameData.address;
        log.debug(`ID owner: ${bitcoinAddress}`);
        let gaiaRead: string;
        let gaiaWrite: string;
        if (nameData.zonefile.match(new RegExp("(.+)https:\/\/hub.cruxpay.com\/hub\/(.+)\/profile.json"))) {
            gaiaWrite = "https://" + nameData.zonefile.match(new RegExp("(.+)https:\/\/(.+)\/hub\/(.+)\/profile.json", "s"))[2];
            gaiaRead = await GaiaService.getGaiaReadUrl(gaiaWrite as string, cacheStorage);
        } else if (nameData.zonefile.match(new RegExp("(.+)https:\/\/(.+)\/profile.json"))) {
            // TODO: remove this case and purge the testcases using this path
            gaiaWrite = "https://hub.blockstack.org";
            gaiaRead = "https://" + nameData.zonefile.match(new RegExp("(.+)https:\/\/(.+)\/(.+)\/profile.json", "s"))[2] + "/";
        } else {
            gaiaWrite = nameData.zonefile.match(new RegExp("https:\/\/(.+)")).slice(0, -1)[0];
            gaiaRead = await GaiaService.getGaiaReadUrl(gaiaWrite as string, cacheStorage);
        }
        const gaiaDetails: IGaiaDetails = {
            gaiaReadUrl: gaiaRead,
            gaiaWriteUrl: gaiaWrite,
            ownerAddress: bitcoinAddress,
        };
        return gaiaDetails;
    }
    private cacheStorage?: StorageService;
    private gaiaHub: string;
    constructor(gaiaHub: string, cacheStorage?: StorageService) {
        this.cacheStorage = cacheStorage;
        this.gaiaHub = gaiaHub;
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
        const readURL = hubInfo.read_url_prefix;
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
        const payload = {
            associationToken,
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
