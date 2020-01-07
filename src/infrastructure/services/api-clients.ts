import { ErrorHelper, PackageErrorCode } from "../../packages/error";
import {BlockstackDomainId} from "../../packages/identity-utils";
import {getLogger} from "../../packages/logger";
import * as utils from "../../packages/utils";
const log = getLogger(__filename);

export class BlockstackSubdomainRegistrarApiClient {
    private baseUrl: string;
    private initPromise: Promise<void>;
    private blockstackDomainId: BlockstackDomainId;
    constructor(baseUrl: string, blockstackDomainId: BlockstackDomainId) {
        this.baseUrl = baseUrl;
        this.blockstackDomainId = blockstackDomainId;
        this.initPromise = this.init();
    }

    public getSubdomainStatus = async (subdomain: string) => {
        await this.initPromise;
        const options = {
            baseUrl: this.baseUrl,
            headers: {
                "x-domain-name": this.blockstackDomainId.components.domain,
            },
            json: true,
            method: "GET",
            url: `/status/${subdomain}`,
        };
        log.debug("registration query params", options);
        return utils.httpJSONRequest(options);
    }
    public registerSubdomain = async (name: string, gaiaHubUrl: string, ownerAdderss: string): Promise<string> => {
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
            registrationAcknowledgement = await utils.httpJSONRequest(options);
        } catch (err) {
            throw ErrorHelper.getPackageError(err, PackageErrorCode.SubdomainRegistrationFailed, err);
        }

        log.debug(`Subdomain registration acknowledgement:`, registrationAcknowledgement);
        if (registrationAcknowledgement && registrationAcknowledgement.status === true) {
            return name;
        } else {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.SubdomainRegistrationAcknowledgementFailed, JSON.stringify(registrationAcknowledgement));
        }
    }
    public fetchPendingRegistrationsByAddress = async (address: string): Promise<string[]> => {
        await this.initPromise;
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
            baseUrl: this.baseUrl,
            headers: {
                "x-domain-name": this.blockstackDomainId.components.domain,
            },
            json: true,
            method: "GET",
            url,
        };
        let registrationsArray: IPendingRegistration[];
        try {
            registrationsArray = ((await utils.httpJSONRequest(options)) as IPendingRegistration[]);
        } catch (error) {
            throw ErrorHelper.getPackageError(error, PackageErrorCode.FetchPendingRegistrationsByAddressFailed, `${this.baseUrl}${url}`, error);
        }
        return registrationsArray.map((registration) => {
            return registration.subdomainName;
        });
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
        return utils.httpJSONRequest(options);
    }

    private init = async () => {
        const indexFromUrl = await this.getIndex();
        const domainFromUrl = indexFromUrl.domainName;
        if (domainFromUrl !== this.blockstackDomainId.toString()) {
            throw Error(`Unexpected Domain from registrar ${domainFromUrl} should be ${this.blockstackDomainId.toString()}`);
        }
    }

}
