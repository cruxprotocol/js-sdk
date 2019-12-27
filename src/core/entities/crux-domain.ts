import { getLogger } from "../../packages/logger";
import { IBlockstackServiceInputOptions } from "../../packages/name-service/blockstack-service";
const log = getLogger(__filename);
export enum DomainRegistrationStatus {
    AVAILABLE = "AVAILABLE",
    PENDING = "PENDING",
    REGISTERED = "REGISTERED",
    REJECTED = "REJECTED",
}
export class CruxDomain {
    public domain: string;
    private _nameserviceConfig?: IBlockstackServiceInputOptions;
    private _status: DomainRegistrationStatus;

    constructor(domain: string, status: DomainRegistrationStatus, nameServiceConfig: IBlockstackServiceInputOptions|undefined) {
        this.domain = domain;
        this._status = status;
        this._nameserviceConfig = nameServiceConfig;
        log.info("CruxDomain initialised");
    }
    get status() {
        return this._status;
    }
    get nameServiceConfig() {
        return this._nameserviceConfig;
    }
    set nameServiceConfig(newNameServiceConfig: IBlockstackServiceInputOptions|undefined) {
        // TODO: validate the newClientConfig
        this._nameserviceConfig = newNameServiceConfig;
    }
}
