import * as blockstack from "blockstack";
import { ErrorHelper, PackageErrorCode } from "../error";
import { getLogger } from "../logger";
import * as nameservice from "../name-service/blockstack-service";
import { fetchNameDetails } from "../name-service/utils";
import { cachedFunctionCall, httpJSONRequest } from "../utils";

const log = getLogger(__filename);

interface IGaiaDetails {
    gaiaReadUrl: string;
    gaiaWriteUrl: string;
    ownerAddress: string;
}

export const getContentFromGaiaHub = async (blockstackId: string, filename: string, bnsNodes: string[], tag?: string): Promise<any> => {
    const gaiaDetails = await getGaiaDataFromBlockstackID(blockstackId, bnsNodes, tag);
    const fileUrl = gaiaDetails.gaiaReadUrl + gaiaDetails.ownerAddress + "/" + filename;
    const options = {
        json: true,
        method: "GET",
        url: fileUrl,
    };

    let finalContent: any;
    const cacheTTL = filename === nameservice.UPLOADABLE_JSON_FILES.CLIENT_CONFIG ? 3600 : undefined;
    const responseBody: any = await cachedFunctionCall(options.url, cacheTTL, httpJSONRequest, [options], async (data) => {
        return Boolean(filename !== nameservice.UPLOADABLE_JSON_FILES.CLIENT_CONFIG || data.indexOf("BlobNotFound") > 0 || data.indexOf("NoSuchKey") > 0);
    });
    if (responseBody.indexOf("BlobNotFound") > 0 || responseBody.indexOf("NoSuchKey") > 0) {
        throw ErrorHelper.getPackageError(null, PackageErrorCode.GaiaEmptyResponse);
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
            throw ErrorHelper.getPackageError(e, PackageErrorCode.TokenVerificationFailed, fileUrl);
        }

        if (addressFromPub === gaiaDetails.ownerAddress) {
            finalContent = content;
        } else {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.CouldNotValidateZoneFile);
        }
    }
    return finalContent;
};

export const getGaiaDataFromBlockstackID = async (blockstackId: string, bnsNodes: string[], tag?: string): Promise<IGaiaDetails> => {
    let nameData: any;
    nameData = await fetchNameDetails(blockstackId, bnsNodes, tag);
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
        gaiaRead = await getGaiaReadUrl(gaiaWrite as string);
    } else if (nameData.zonefile.match(new RegExp("(.+)https:\/\/(.+)\/profile.json"))) {
        // TODO: remove this case and purge the testcases using this path
        gaiaRead = "https://" + nameData.zonefile.match(new RegExp("(.+)https:\/\/(.+)\/(.+)\/profile.json", "s"))[2] + "/";
        gaiaWrite = "https://hub.blockstack.org";
    } else {
        gaiaWrite = nameData.zonefile.match(new RegExp("https:\/\/(.+)")).slice(0, -1)[0];
        gaiaRead = await getGaiaReadUrl(gaiaWrite as string);
    }
    const gaiaDetails: IGaiaDetails = {
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
        throw ErrorHelper.getPackageError(err, PackageErrorCode.GaiaGetFileFailed, err);
    }
};
