import { AssertionError, deepStrictEqual } from "assert";
import { getLogger } from "../..";
import { ErrorHelper, PackageErrorCode } from "../error";
import { BlockstackId, CRUX_DOMAIN_SUFFIX, DEFAULT_BLOCKSTACK_NAMESPACE, IdTranslator } from "../identity-utils";
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

export const getCruxIDByAddress = async (bnsNodes: string[], address: string): Promise<string|null> => {
    const nodePromises = bnsNodes.map((baseUrl) => bnsFetchNamesByAddress(baseUrl, address));
    const responseArr: string[][] = await Promise.all(nodePromises);
    const commonNames = [...(responseArr.map((arr) => new Set(arr)).reduce((a, b) => new Set([...a].filter((x) => b.has(x)))))];
    const bsId = commonNames.find((name) => {
        const regex = new RegExp(`(.+)\.(.+)${CRUX_DOMAIN_SUFFIX}.${DEFAULT_BLOCKSTACK_NAMESPACE}`);
        const match = name.match(regex);
        return match && match[0];
    });
    if (!bsId) {
        // Fetch any pending registrations on the address using the registrar
    }
    return (bsId && IdTranslator.blockstackToCrux(BlockstackId.fromString(bsId)).toString()) || null;
};

const bnsFetchNamesByAddress = async (baseUrl: string, address: string): Promise<string[]> => {
    const url = `/v1/addresses/bitcoin/${address}`;
    const options = {
        baseUrl,
        json: true,
        method: "GET",
        url,
    };
    let namesData: {names: string[]};
    try {
        namesData = ((await httpJSONRequest(options)) as {names: string[]});
    } catch (error) {
        throw ErrorHelper.getPackageError(PackageErrorCode.GetNamesByAddressFailed, `${baseUrl}${url}`, error);
    }
    return namesData.names;
};
