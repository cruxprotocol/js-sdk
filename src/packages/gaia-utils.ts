import * as blockstack from "blockstack";
import { getLogger } from "..";
import * as Errors from "./error";
import { fetchNameDetails } from "./nameservice-utils";
import { httpJSONRequest } from "./utils";

const log = getLogger(__filename);

export let getContentFromGaiaHub = async (blockstackId: string, filename: string, type= "application/json"): Promise<any> => {
    console.groupCollapsed("Resolving content from gaiaHub");
    let fileUrl: string;
    const gaiaDetails = await getGaiaHubUrlsFromBlockstackID(blockstackId);
    if (gaiaDetails.gaiaWriteUrl) {
        fileUrl = _getGaiaReadUrl(gaiaDetails.gaiaWriteUrl as string) + filename;
    } else {
        throw new Error("No backward compaitability!");
    }
    const options = {
        json: true,
        method: "GET",
        url: fileUrl,
    };

    let finalContent: any;
    const responseBody: any = await httpJSONRequest(options);
    log.debug(`Response from ${filename}`, responseBody);
    let content: string;

    if (responseBody.indexOf("BlobNotFound") > 0) {
        finalContent = "";
    } else {
        try {
            content = responseBody[0].decodedToken.payload.claim;
            if (!(type === "application/json")) {
                log.error(`unhandled content type`);
                console.groupEnd();
                throw new Error("invalid content type");
            }
            log.debug(`Content:- `, content);
        } catch (e) {
            log.error(e);
            console.groupEnd();
            throw new Error((`Probably this id resolves to a domain registrar`));
        }

        const pubKey = responseBody[0].decodedToken.payload.subject.publicKey;
        const addressFromPub = blockstack.publicKeyToAddress(pubKey);

        // validate the file integrity with the token signature
        try {
            blockstack.verifyProfileToken(responseBody[0].token, pubKey);
        } catch (e) {
            // TODO: validate the token properly after publishing the subject
            log.error(e);
            console.groupEnd();
            throw new Errors.ClientErrors.TokenVerificationFailed(`Token Verification failed for ${fileUrl}`, 2016);
        }

        if (addressFromPub === gaiaDetails.ownerAddress) {
            finalContent = content;
        } else {
            console.groupEnd();
            throw new Error(`Invalid zonefile`);
        }
    }
    console.groupEnd();
    return finalContent;
};

export let getGaiaHubUrlsFromBlockstackID = async (blockstackId: string) => {
    console.groupCollapsed("Resolving gaiaHubUrls from BlockstackID");
    let nameData: any;
    try {
        nameData = fetchNameDetails(blockstackId);
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
        gaiaHub = nameData.zonefile.match(new RegExp("https:\/\/(.+)")).slice(0, -1);
        // gaiaRead = "https://" + nameData.zonefile.match(new RegExp("(.+)https:\/\/(.+)\/profile.json", "s"))[2] + "/";
    }
    return {
        gaiaWriteUrl: gaiaHub,
        ownerAddress: bitcoinAddress,
    };
};

const _getGaiaReadUrl = async (gaiaHubURL: string): Promise<string> => {
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
        throw new Errors.ClientErrors.GaiaGetFileFailed(`Unable to get gaia read url prefix: ${err}`, 2105);
    }
};
