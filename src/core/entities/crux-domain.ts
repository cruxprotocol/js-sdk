import { IClientConfig } from "../../packages/configuration-service";
import { BaseError } from "../../packages/error";
import { CruxDomainId } from "../../packages/identity-utils";
import { getLogger } from "../../packages/logger";
import { CruxSpec } from "./crux-spec";
const log = getLogger(__filename);
export enum DomainRegistrationStatus {
    AVAILABLE = "AVAILABLE",
    PENDING = "PENDING",
    REGISTERED = "REGISTERED",
    REJECTED = "REJECTED",
}
export class CruxDomain {
    public domainId: CruxDomainId;
    private domainConfig!: IClientConfig;
    private registrationStatus!: DomainRegistrationStatus;
    constructor(domain: CruxDomainId, registrationStatus: DomainRegistrationStatus, domainConfig: IClientConfig) {
        this.domainId = domain;
        this.setRegistrationStatus(registrationStatus);
        this.setConfig(domainConfig);
        log.info("CruxDomain initialised");
    }
    get status() {
        return this.registrationStatus;
    }
    get config() {
        return this.domainConfig;
    }
    set config(domainConfig: IClientConfig) {
        this.setConfig(domainConfig);
    }
    private setRegistrationStatus = (registrationStatus: DomainRegistrationStatus) => {
        // validate and set the registrationStatus
        if (!(registrationStatus in DomainRegistrationStatus)) {
            throw new BaseError(null, `Domain registration status validation failed!`);
        }
        this.registrationStatus = registrationStatus;
    }
    private setConfig = (domainConfig: IClientConfig) => {
        // validate and set the config
        try {
            CruxSpec.validations.validateAssetList(domainConfig.assetList);
            CruxSpec.validations.validateAssetMapping(domainConfig.assetMapping);
            if (domainConfig.nameserviceConfiguration) {CruxSpec.validations.validateNameServiceConfig(domainConfig.nameserviceConfiguration);}
        } catch (e) {
            throw new BaseError(e, `Domain config validation failed!`);
        }
        this.domainConfig = domainConfig;
    }
}
