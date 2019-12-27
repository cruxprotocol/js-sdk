import { getLogger } from "../../packages/logger";
import { IBlockstackServiceInputOptions } from "../../packages/name-service/blockstack-service";
const log = getLogger(__filename);
export enum DomainRegistrationStatus {
    AVAILABLE = "AVAILABLE",
    PENDING = "PENDING",
    REGISTERED = "REGISTERED",
    REJECTED = "REJECTED",
}
export interface ICruxDomainConfig {
    nameserviceConfig?: IBlockstackServiceInputOptions;
}
export class CruxDomain {
    public domain: string;
    private _domainConfig: ICruxDomainConfig = {};
    private _status: DomainRegistrationStatus;

    constructor(domain: string, status: DomainRegistrationStatus, nameServiceConfig: IBlockstackServiceInputOptions|undefined) {
        this.domain = domain;
        this._status = status;
        this._domainConfig.nameserviceConfig = nameServiceConfig;
        log.info("CruxDomain initialised");
    }
    get status() {
        return this._status;
    }
    get config() {
        return this._domainConfig;
    }
    set config(domainConfig: ICruxDomainConfig) {
        // TODO: validate the newClientConfig
        this._domainConfig = domainConfig;
    }
}
