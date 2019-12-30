import { IClientConfig } from "../../packages/configuration-service";
import { getLogger } from "../../packages/logger";
const log = getLogger(__filename);
export enum DomainRegistrationStatus {
    AVAILABLE = "AVAILABLE",
    PENDING = "PENDING",
    REGISTERED = "REGISTERED",
    REJECTED = "REJECTED",
}
export class CruxDomain {
    public domain: string;
    private _domainConfig: IClientConfig;
    private _status: DomainRegistrationStatus;

    constructor(domain: string, status: DomainRegistrationStatus, domainConfig: IClientConfig) {
        this.domain = domain;
        this._status = status;
        this._domainConfig = domainConfig;
        log.info("CruxDomain initialised");
    }
    get status() {
        return this._status;
    }
    get config() {
        return this._domainConfig;
    }
    set config(domainConfig: IClientConfig) {
        // TODO: validate the newClientConfig
        this._domainConfig = domainConfig;
    }
}
