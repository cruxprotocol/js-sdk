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
    private domainConfig: IClientConfig;
    private registrationStatus: DomainRegistrationStatus;

    constructor(domain: CruxDomainId, registrationStatus: DomainRegistrationStatus, domainConfig: IClientConfig) {
        this.domainId = domain;
        this.registrationStatus = registrationStatus;
        this.domainConfig = domainConfig;
        log.info("CruxDomain initialised");
    }
    get status() {
        return this.registrationStatus;
    }
    get config() {
        return this.domainConfig;
    }
    set config(domainConfig: IClientConfig) {
        // TODO: validate the newClientConfig
        this.domainConfig = domainConfig;
    }
}
