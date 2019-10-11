import * as blockstack from "blockstack";
import { getLogger } from "../..";
import config from "../../config";
import { ErrorHelper, PackageErrorCode } from "../error";
import * as nameservice from "../name-service/blockstack-service";
import { fetchNameDetails } from "../name-service/utils";
import { cachedFunctionCall, httpJSONRequest } from "../utils";

const log = getLogger(__filename);

interface gaiaData {
    gaiaReadUrl: string;
    gaiaWriteUrl: string | undefined;
    ownerAddress: string;
}

export const getContentFromGaiaHub = async (blockstackId: string, filename: nameservice.UPLOADABLE_JSON_FILES, type= "application/json"): Promise<any> => {
    let fileUrl: string;
    const gaiaDetails = await getGaiaDataFromBlockstackID(blockstackId);
    fileUrl = gaiaDetails.gaiaReadUrl + gaiaDetails.ownerAddress + "/" + filename;
    const options = {
        json: true,
        method: "GET",
        url: fileUrl,
    };

    let finalContent: any;
    let responseBody: any;
    const cacheTTL = filename === nameservice.UPLOADABLE_JSON_FILES.CLIENT_CONFIG ? 3600 : undefined;
    try {
        responseBody = await cachedFunctionCall(options.url, cacheTTL, httpJSONRequest, [options], async (data) => {
            return Boolean(filename !== nameservice.UPLOADABLE_JSON_FILES.CLIENT_CONFIG || data.indexOf("BlobNotFound") > 0 || data.indexOf("NoSuchKey") > 0);
        });
        log.debug(`Response from ${filename}`, responseBody);
    } catch (error) {
        const packageErrorCode = nameservice.BlockstackService.getUploadPackageErrorCodeForFilename(filename);
        throw ErrorHelper.getPackageError(packageErrorCode, filename, error);
    }
    if (responseBody.indexOf("BlobNotFound") > 0 || responseBody.indexOf("NoSuchKey") > 0) {
        throw ErrorHelper.getPackageError(PackageErrorCode.GaiaEmptyResponse);
    } else {
        const content = responseBody[0].decodedToken.payload.claim;
        const pubKey = responseBody[0].decodedToken.payload.subject.publicKey;
        const addressFromPub = blockstack.publicKeyToAddress(pubKey);

        // validate the file integrity with the token signature
        try {
            blockstack.verifyProfileToken(responseBody[0].token, pubKey);
        } catch (e) {
            // TODO: validate the token properly after publishing the subject
            log.error(e);
            throw ErrorHelper.getPackageError(PackageErrorCode.TokenVerificationFailed, fileUrl);
        }

        if (addressFromPub === gaiaDetails.ownerAddress) {
            finalContent = content;
        } else {
            throw ErrorHelper.getPackageError(PackageErrorCode.CouldNotValidateZoneFile);
        }
    }
    return finalContent;
};

export const getGaiaDataFromBlockstackID = async (blockstackId: string): Promise<gaiaData> => {
    let nameData: any;
    const bnsNodes: string[] = config.BLOCKSTACK.BNS_NODES;
    nameData = await fetchNameDetails(blockstackId, bnsNodes);
    log.debug(nameData);
    if (!nameData) {
        throw ErrorHelper.getPackageError(PackageErrorCode.BnsEmptyData);
    }
    if (!nameData.address) {
        throw ErrorHelper.getPackageError(PackageErrorCode.UserDoesNotExist);
    }
    const bitcoinAddress = nameData.address;
    log.debug(`ID owner: ${bitcoinAddress}`);
    let gaiaRead: string;
    let gaiaWrite: string | undefined;
    if (nameData.zonefile.match(new RegExp("(.+)https:\/\/(.+)\/profile.json"))) {
        gaiaRead = "https://" + nameData.zonefile.match(new RegExp("(.+)https:\/\/(.+)\/(.+)\/profile.json", "s"))[2] + "/";
    } else {
        gaiaWrite = nameData.zonefile.match(new RegExp("https:\/\/(.+)")).slice(0, -1)[0];
        gaiaRead = await getGaiaReadUrl(gaiaWrite as string);
    }
    const gaiaDetails: gaiaData = {
        gaiaReadUrl: gaiaRead,
        gaiaWriteUrl: gaiaWrite,
        ownerAddress: bitcoinAddress,
    };
    return gaiaDetails;
};

export const getGaiaReadUrl = async (gaiaWriteURL: string): Promise<string> => {
    const options = {
        json: true,
        method: "GET",
        url: gaiaWriteURL + "/hub_info" ,
    };
    try {
        const responseBody: any = await cachedFunctionCall(options.url, 3600, httpJSONRequest, [options]);
        const gaiaReadURL = responseBody.read_url_prefix;
        return gaiaReadURL;
    } catch (err) {
        throw ErrorHelper.getPackageError(PackageErrorCode.GaiaGetFileFailed, err);
    }
};
