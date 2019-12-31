import {getLogger} from "../../packages/logger";
import * as utils from "../../packages/utils";
const log = getLogger(__filename);

export class BlockstackSubdomainRegistrarApiClient {
    private baseUrl: string;
    private domain: string;
    constructor(baseUrl: string, domain: string) {
        this.baseUrl = baseUrl;
        this.domain = domain;
    }

    public getSubdomainStatus = async (subdomain: string) => {
        const options = {
            baseUrl: this.baseUrl,
            headers: {
                "x-domain-name": this.domain,
            },
            json: true,
            method: "GET",
            url: `/status/${subdomain}`,
        };
        log.debug("registration query params", options);
        return await utils.httpJSONRequest(options);
    }
}
