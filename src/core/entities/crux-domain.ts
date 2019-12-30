import { IClientConfig } from "../../packages/configuration-service";
import { CruxDomainId } from "../../packages/identity-utils";
import { getLogger } from "../../packages/logger";
const log = getLogger(__filename);
export enum DomainRegistrationStatus {
    AVAILABLE = "AVAILABLE",
    PENDING = "PENDING",
    REGISTERED = "REGISTERED",
    REJECTED = "REJECTED",
}
export class CruxDomain {
    public domainId: CruxDomainId;
    private _domainConfig: IClientConfig;
    private _status: DomainRegistrationStatus;

    constructor(domain: CruxDomainId, status: DomainRegistrationStatus, domainConfig: IClientConfig) {
        this.domainId = domain;
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
