import { IClientAssetMapping, IGlobalAssetList } from "../../application/services/crux-asset-translator";
import { BaseError } from "../../packages/error";
import { CruxDomainId } from "../../packages/identity-utils";
import { getLogger } from "../../packages/logger";
import { CruxSpec } from "./crux-spec";
const log = getLogger(__filename);
export interface INameServiceConfigurationOverrides {
    bnsNodes?: string[];
    gaiaHub?: string;
    subdomainRegistrar?: string;
}
export interface IClientConfig {
    assetMapping: IClientAssetMapping;
    assetList: IGlobalAssetList;
    nameserviceConfiguration?: INameServiceConfigurationOverrides;
}
export enum DomainRegistrationStatus {
    AVAILABLE = "AVAILABLE",
    PENDING = "PENDING",
    REGISTERED = "REGISTERED",
    REJECTED = "REJECTED",
}
export class CruxDomain {
    private domainId: CruxDomainId;
    private domainConfig!: IClientConfig;
    private registrationStatus!: DomainRegistrationStatus;
    constructor(cruxDomainId: CruxDomainId, registrationStatus: DomainRegistrationStatus, domainConfig: IClientConfig) {
        this.domainId = cruxDomainId;
        this.setRegistrationStatus(registrationStatus);
        this.setConfig(domainConfig);
        log.info("CruxDomain initialised");
    }
    get id() {
        return this.domainId;
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
            if (domainConfig.assetList) {CruxSpec.validations.validateAssetList(domainConfig.assetList); }
            if (domainConfig.assetMapping) {CruxSpec.validations.validateAssetMapping(domainConfig.assetMapping); }
            if (domainConfig.nameserviceConfiguration) {CruxSpec.validations.validateNameServiceConfig(domainConfig.nameserviceConfiguration); }
        } catch (e) {
            throw new BaseError(e, `Domain config validation failed!`);
        }
        this.domainConfig = domainConfig;
    }
}
