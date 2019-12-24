import { DomainRegistrationStatus } from ".";
import { IClientAssetMapping, IGlobalAssetList } from "../packages/configuration-service";
import { getLogger } from "../packages/logger";
import { IBlockstackServiceInputOptions } from "../packages/name-service/blockstack-service";

const log = getLogger(__filename);

export class CruxDomain {
    public domain: string;
    private _assetMapping: IClientAssetMapping;
    private _assetList: IGlobalAssetList;
    private _nameserviceConfig?: IBlockstackServiceInputOptions;
    private _status: DomainRegistrationStatus;

    constructor(domain: string, status: DomainRegistrationStatus, assetMapping: IClientAssetMapping, assetList: IGlobalAssetList, nameServiceConfig?: IBlockstackServiceInputOptions) {
        this.domain = domain;
        this._status = status;
        this._assetMapping = assetMapping;
        this._assetList = assetList;
        this._nameserviceConfig = nameServiceConfig;
        log.info("CruxDomain initialised");
    }
    get status() {
        return this._status;
    }
    get assetMap() {
        return this._assetMapping;
    }
    set assetMap(newAssetMap: IClientAssetMapping) {
        // todo: validate the newAssetMap
        this._assetMapping = newAssetMap;
    }
    get assetList() {
        return this._assetList;
    }
    set assetList(newAssetList: IGlobalAssetList) {
        // todo: validate the newAssetList
        this._assetList = newAssetList;
    }
    get nameServiceConfig() {
        return this._nameserviceConfig;
    }
    set nameServiceConfig(newNameServiceConfig: IBlockstackServiceInputOptions | undefined) {
        // todo: validate the newClientConfig
        this._nameserviceConfig = newNameServiceConfig;
    }
}
