import { AssertionError, deepStrictEqual } from "assert";
import { ErrorHelper, PackageErrorCode } from "../error";
import { BlockstackId, CRUX_DOMAIN_SUFFIX, DEFAULT_BLOCKSTACK_NAMESPACE, IdTranslator } from "../identity-utils";
import { getLogger } from "../logger";
import { cachedFunctionCall, httpJSONRequest } from "../utils";

const log = getLogger(__filename);

export const fetchNameDetails = async (blockstackId: string, bnsNodes: string[], tag?: string): Promise<object|undefined> => {
    const nodeResponses = bnsNodes.map((baseUrl) => bnsResolveName(baseUrl, blockstackId, tag));
    log.debug(`BNS node responses:`, nodeResponses);

    const responsesArr: object[] = await Promise.all(nodeResponses);
    log.debug(`BNS resolved JSON array:`, responsesArr);
    let prevRes;
    let response: object;
    for (let i = 0; i < responsesArr.length; i++) {
        const res = responsesArr[i];
        if (i === 0) {
            prevRes = res;
        } else {
            try {
                deepStrictEqual(prevRes, res);
            } catch (e) {
                if (e instanceof AssertionError) {
                    throw ErrorHelper.getPackageError(e, PackageErrorCode.NameIntegrityCheckFailed);
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

const bnsResolveName = async (baseUrl: string, blockstackId: string, tag?: string): Promise<object> => {
    const options = {
        baseUrl,
        json: true,
        method: "GET",
        qs: {
            "x-tag": tag,
        },
        url: `/v1/names/${blockstackId}`,
    };
    let nameData;
    try {
        nameData = await cachedFunctionCall(`${options.baseUrl}${options.url}`, 3600, httpJSONRequest, [options], async (data) => Boolean(data && data.status && data.status !== "registered_subdomain"));
    } catch (error) {
        throw ErrorHelper.getPackageError(error, PackageErrorCode.BnsResolutionFailed, baseUrl, error);
    }
    return nameData;
};

export const getCruxIDByAddress = async (walletClientName: string, address: string, bnsNodes: string[], registrar: string): Promise<string|null> => {
    const nodePromises = bnsNodes.map((baseUrl) => bnsFetchNamesByAddress(baseUrl, address));
    const responseArr: string[][] = await Promise.all(nodePromises);
    const commonNames = [...(responseArr.map((arr) => new Set(arr)).reduce((a, b) => new Set([...a].filter((x) => b.has(x)))))];
    let bsId = commonNames.find((name) => {
        const regex = new RegExp(`(.+)\.${IdTranslator.cruxDomainToBlockstackDomain(walletClientName)}.${DEFAULT_BLOCKSTACK_NAMESPACE}`);
        const match = name.match(regex);
        return match && match[0];
    });
    if (!bsId) {
        // Fetch any pending registrations on the address using the registrar
        const pendingSubdomains = await fetchPendingRegistrationsByAddress(walletClientName, registrar, address);
        if (pendingSubdomains.length !== 0) {
            bsId = new BlockstackId({domain: IdTranslator.cruxDomainToBlockstackDomain(walletClientName), subdomain: pendingSubdomains[0]}).toString();
        }
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
        throw ErrorHelper.getPackageError(error, PackageErrorCode.GetNamesByAddressFailed, `${baseUrl}${url}`, error);
    }
    return namesData.names;
};

const fetchPendingRegistrationsByAddress = async (walletClientName: string, registrar: string, address: string): Promise<string[]> => {
    interface IPendingRegistration {
        owner: string;
        queue_ix: number;
        received_ts: string;
        sequenceNumber: string;
        signature: string;
        status: string;
        status_more: string;
        subdomainName: string;
        zonefile: string;
    }

    const url = `/subdomain/${address}`;
    const options = {
        baseUrl: registrar,
        headers: {"x-domain-name": `${walletClientName}${CRUX_DOMAIN_SUFFIX}`},
        json: true,
        method: "GET",
        url,
    };
    let registrationsArray: IPendingRegistration[];
    try {
        registrationsArray = ((await httpJSONRequest(options)) as IPendingRegistration[]);
    } catch (error) {
        throw ErrorHelper.getPackageError(error, PackageErrorCode.FetchPendingRegistrationsByAddressFailed, `${registrar}${url}`, error);
    }
    return registrationsArray.map((registration) => {
        return registration.subdomainName;
    });
};
