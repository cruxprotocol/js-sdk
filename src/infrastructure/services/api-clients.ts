import { BaseError, ErrorHelper, PackageErrorCode } from "../../packages/error";
import {BlockstackDomainId} from "../../packages/identity-utils";
import {getLogger} from "../../packages/logger";
import { UPLOADABLE_JSON_FILES } from "../../packages/name-service/blockstack-service";
import { StorageService } from "../../packages/storage";
import { cachedFunctionCall, httpJSONRequest } from "../../packages/utils";
const log = getLogger(__filename);
export interface IHubInfo {
    challenge_text: string;
    latest_auth_version: string;
    max_file_upload_size_megabytes: number;
    read_url_prefix: string;
}
export class GaiaServiceApiClient {
    public static getHubInfo = async (gaiaHub: string, cacheStorage?: StorageService): Promise<IHubInfo> => {
        const options = {
            baseUrl: gaiaHub,
            url: "/hub_info",
        };
        return cachedFunctionCall(cacheStorage, `${options.baseUrl}${options.url}`, 3600, httpJSONRequest, [options]) as Promise<IHubInfo>;
    }
    public static store = async (gaiaHub: string, filename: string, address: string, authToken: string, contents: string, contentType = "application/octet-stream"): Promise<{publicURL: string}> => {
        const options = {
            baseUrl: gaiaHub,
            body: JSON.parse(contents),
            headers: {
                "Authorization": `bearer ${authToken}`,
                "Content-Type": contentType,
            },
            method: "POST",
            url: `/store/${address}/${filename}`,
        };
        let response: any;
        try {
            response = await httpJSONRequest(options);
            return response;
        } catch (error) {
            throw new BaseError(error, "Error when uploading to Gaia hub");
        }
    }
    public static retrieve = async (readURLPrefix: string, filename: string, address: string, cacheStorage?: StorageService) => {
        const options = {
            baseUrl: readURLPrefix,
            json: true,
            method: "GET",
            url: `${address}/${filename}`,
        };

        const cacheTTL = filename === UPLOADABLE_JSON_FILES.CLIENT_CONFIG ? 3600 : undefined;
        const responseBody: any = await cachedFunctionCall(cacheStorage, options.url, cacheTTL, httpJSONRequest, [options], async (data) => {
            return Boolean(filename !== UPLOADABLE_JSON_FILES.CLIENT_CONFIG || data.indexOf("BlobNotFound") > 0 || data.indexOf("NoSuchKey") > 0);
        });
        return responseBody;
    }
}
export interface INameDetails {
    address?: string;
    blockchain?: string;
    did?: string;
    last_txid?: string;
    status?: string;
    zonefile?: string;
    zonefile_hash?: string;
    more?: string;
}
export class BlockstackNamingServiceApiClient {
    public static getNamesByAddress = async (bnsNode: string, address: string, cacheStorage?: StorageService): Promise<{names: string[]}> => {
        const options = {
            baseUrl: bnsNode,
            json: true,
            method: "GET",
            url: `/v1/addresses/bitcoin/${address}`,
        };
        try {
            const namesData = (await httpJSONRequest(options)) as {names: string[]};
            return namesData;
        } catch (error) {
            throw ErrorHelper.getPackageError(error, PackageErrorCode.GetNamesByAddressFailed, `${options.baseUrl}${options.url}`, error);
        }
    }
    public static getNameDetails = async (bnsNode: string, blockstackName: string, tag?: string, cacheStorage?: StorageService): Promise<INameDetails> => {
        const options: any = {
            baseUrl: bnsNode,
            json: true,
            method: "GET",
            qs: null,
            url: `/v1/names/${blockstackName}`,
        };
        if (tag) {
            options.qs = {
                "x-tag": tag,
            };
        }
        let nameData;
        try {
            nameData = await cachedFunctionCall(cacheStorage, `${options.baseUrl}${options.url}`, 3600, httpJSONRequest, [options], async (data) => Boolean(data && data.status && data.status !== "registered_subdomain"));
        } catch (error) {
            throw ErrorHelper.getPackageError(error, PackageErrorCode.BnsResolutionFailed, options.baseUrl, error);
        }
        return nameData;
    }
}
export interface ISubdomainRegistrarEntry {
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
export class BlockstackSubdomainRegistrarApiClient {
    private baseUrl: string;
    private initPromise: Promise<void>;
    private blockstackDomainId: BlockstackDomainId;
    constructor(baseUrl: string, blockstackDomainId: BlockstackDomainId) {
        this.baseUrl = baseUrl;
        this.blockstackDomainId = blockstackDomainId;
        this.initPromise = this.init();
    }

    public getSubdomainStatus = async (subdomainString: string): Promise<{status: string, statusCode?: number}> => {
        await this.initPromise;
        const options = {
            baseUrl: this.baseUrl,
            headers: {
                "x-domain-name": this.blockstackDomainId.components.domain,
            },
            json: true,
            method: "GET",
            url: `/status/${subdomainString}`,
        };
        log.debug("registration query params", options);
        return httpJSONRequest(options) as any;
    }
    public registerSubdomain = async (name: string, gaiaHubUrl: string, ownerAdderss: string): Promise<void> => {
        await this.initPromise;
        const options = {
            baseUrl: this.baseUrl,
            body: {
                name,
                owner_address: ownerAdderss,
                zonefile: `$ORIGIN ${name}\n$TTL 3600\n_https._tcp URI 10 1 ${gaiaHubUrl}`,
            },
            headers: {
                "Content-Type": "application/json",
                "x-domain-name": this.blockstackDomainId.components.domain,
            },
            json: true,
            method: "POST",
            strictSSL: false,
            url: "/register",
        };

        let registrationAcknowledgement: any;
        try {
            registrationAcknowledgement = await httpJSONRequest(options);
        } catch (err) {
            throw ErrorHelper.getPackageError(err, PackageErrorCode.SubdomainRegistrationFailed, err);
        }

        log.debug(`Subdomain registration acknowledgement:`, registrationAcknowledgement);
        if (registrationAcknowledgement && registrationAcknowledgement.status === true) {
            return;
        } else {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.SubdomainRegistrationAcknowledgementFailed, JSON.stringify(registrationAcknowledgement));
        }
    }
    public getSubdomainRegistrarEntriesByAddress = async (address: string): Promise<ISubdomainRegistrarEntry[]> => {
        await this.initPromise;
        const url = `/subdomain/${address}`;
        const options = {
            baseUrl: this.baseUrl,
            headers: {
                "x-domain-name": this.blockstackDomainId.components.domain,
            },
            json: true,
            method: "GET",
            url,
        };
        let registrationsArray: ISubdomainRegistrarEntry[];
        try {
            registrationsArray = (await httpJSONRequest(options)) as ISubdomainRegistrarEntry[];
            return registrationsArray;
        } catch (error) {
            throw ErrorHelper.getPackageError(error, PackageErrorCode.FetchPendingRegistrationsByAddressFailed, `${options.baseUrl}${options.url}`, error);
        }
    }
    public getIndex = async (): Promise<any> => {
        const options = {
            baseUrl: this.baseUrl,
            headers: {
                "x-domain-name": this.blockstackDomainId.components.domain,
            },
            json: true,
            method: "GET",
            url: `/index`,
        };
        log.debug("registration query params", options);
        return httpJSONRequest(options);
    }

    private init = async () => {
        const indexFromUrl = await this.getIndex();
        const domainFromUrl = indexFromUrl.domainName;
        if (domainFromUrl !== this.blockstackDomainId.toString()) {
            throw new BaseError(null, `Unexpected Domain from registrar ${domainFromUrl} should be ${this.blockstackDomainId.toString()}`);
        }
    }

}
