import * as blockstack from "blockstack";
import { getLogger } from "../..";
import config from "../../config";
import { ErrorHelper, PackageErrorCode } from "../error";
import { UPLOADABLE_JSON_FILES } from "../name-service/blockstack-service";
import { fetchNameDetails } from "../name-service/utils";
import { httpJSONRequest } from "../utils";

const log = getLogger(__filename);

export let getContentFromGaiaHub = async (blockstackId: string, filename: UPLOADABLE_JSON_FILES, type= "application/json"): Promise<any> => {
    let fileUrl: string;
    const gaiaDetails = await getGaiaHubUrlsFromBlockstackID(blockstackId);
    fileUrl = gaiaDetails.gaiaReadUrl + filename;
    const options = {
        json: true,
        method: "GET",
        url: fileUrl,
    };

    let finalContent: any;
    const responseBody: any = await httpJSONRequest(options);
    log.debug(`Response from ${filename}`, responseBody);

    if (responseBody.indexOf("BlobNotFound") > 0) {
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

export let getGaiaHubUrlsFromBlockstackID = async (blockstackId: string) => {
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
    let gaiaHub: string | undefined;
    if (nameData.zonefile.match(new RegExp("(.+)https:\/\/(.+)\/profile.json"))) {
        gaiaRead = "https://" + nameData.zonefile.match(new RegExp("(.+)https:\/\/(.+)\/profile.json", "s"))[2] + "/";
    } else {
        gaiaHub = nameData.zonefile.match(new RegExp("https:\/\/(.+)")).slice(0, -1);
        gaiaRead = await getGaiaReadUrl(gaiaHub as string);
    }
    return {
        gaiaReadUrl: gaiaRead,
        gaiaWriteUrl: gaiaHub,
        ownerAddress: bitcoinAddress,
    };
};

export const getGaiaReadUrl = async (gaiaHubURL: string): Promise<string> => {
    const options = {
        json: true,
        method: "GET",
        url: gaiaHubURL + "/hub_info" ,
    };
    try {
        const responseBody: any = await httpJSONRequest(options);
        const gaiaReadURL = responseBody.read_url_prefix;
        return gaiaReadURL;
    } catch (err) {
        throw ErrorHelper.getPackageError(PackageErrorCode.GaiaGetFileFailed, err);
    }
};
