import { AssertionError, deepStrictEqual } from "assert";
import { getLogger } from "../..";
import { ErrorHelper, PackageErrorCode } from "../error";
import { BlockstackId, IdTranslator } from "../identity-utils";
import { cachedFunctionCall, httpJSONRequest } from "../utils";

const log = getLogger(__filename);

export const fetchNameDetails = async (blockstackId: string, bnsNodes: string[]): Promise<object|undefined> => {
    const nodeResponses = bnsNodes.map((baseUrl) => bnsResolveName(baseUrl, blockstackId));
    log.debug(`BNS node responses:`, nodeResponses);

    const responsesArr: object[] = await Promise.all(nodeResponses);
    log.debug(`BNS resolved JSON array:`, responsesArr);
    let prev_res;
    let response: object;
    for (let i = 0; i < responsesArr.length; i++) {
        const res = responsesArr[i];
        if (i === 0) {
            prev_res = res;
        } else {
            try {
                deepStrictEqual(prev_res, res);
            } catch (e) {
                if (e instanceof AssertionError) {
                    throw ErrorHelper.getPackageError(PackageErrorCode.NameIntegrityCheckFailed);
                } else {
                    log.error(e);
                    throw e;
                }
            }
        }
        // TODO: unhandled else case
        if (i === responsesArr.length - 1) {
            response = responsesArr[0];
        }
    }
    // @ts-ignore
    return response;
};

const bnsResolveName = async (baseUrl: string, blockstackId: string): Promise<object> => {
    const options = {
        baseUrl,
        json: true,
        method: "GET",
        url: `/v1/names/${blockstackId}`,
    };
    let nameData;
    try {
        nameData = await cachedFunctionCall(`${options.baseUrl}${blockstackId}`, 3600, httpJSONRequest, [options], async (data) => Boolean(data && data.status && data.status !== "registered_subdomain"));
    } catch (error) {
        throw ErrorHelper.getPackageError(PackageErrorCode.BnsResolutionFailed, baseUrl, error);
    }
    return nameData;
};

export const getCruxIDByAddress = async (bnsUrl: string, walletClientName: string, address: string) => {
    // TODO: need to shift this call from BNS nodes to registrar
    const url = `/v1/addresses/bitcoin/${address}`;
    const options = {
        baseUrl: bnsUrl,
        json: true,
        method: "GET",
        url,
    };
    let names: string[];
    try {
        const namesData = (await httpJSONRequest(options) as {names: string[]});
        names = namesData.names;
    } catch (error) {
        throw ErrorHelper.getPackageError(PackageErrorCode.GetNamesByAddressFailed, `${bnsUrl}${url}`, error);
    }
    const cruxIDs = names.map((name) => {
        const regex = new RegExp(`(.+)\.${walletClientName}_crux.id`);
        const match = name.match(regex);
        return match && IdTranslator.blockstackToCrux(BlockstackId.fromString(match[0])).toString();
    }).filter((subdomain) => subdomain);

    return cruxIDs;
};
