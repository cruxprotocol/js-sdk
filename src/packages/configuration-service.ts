import { getLogger } from "..";
import config from "../config";
import * as identityUtils from "./identity-utils";
import * as nameservice from "./nameservice";
import * as utils from "./utils";
import {BlockstackService} from "./nameservice";
import {ErrorHelper, PackageError, PackageErrorCode} from "./index";

const log = getLogger(__filename);

export abstract class NameServiceConfigurationService {
    constructor() {
        log.info(`Initizing NameServiceConfigurationService with options:- `);
    }

    public abstract getGlobalAssetList = async (): Promise<object> => ({});
    public abstract getClientAssetMapping = async (clientName: string): Promise<object> => ({});
    public abstract getClientConfig = async (clientName: string): Promise<any> => ({});
}

export class BlockstackConfigurationService extends NameServiceConfigurationService {

    private settingsDomain = config.BLOCKSTACK.SETTINGS_DOMAIN;

    private blockstackNameservice: nameservice.BlockstackService;
    private clientName: string;
    private clientConfig: any;

    constructor(clientName: string) {
        super();
        this.clientName = clientName;
        this.blockstackNameservice = new nameservice.BlockstackService();
        log.info(`BlockstackConfigurationService initialised with default configs`);
    }

    public init = async () => {
        this.clientConfig = await this.getClientConfig(this.clientName);
    }

    @utils.groupLogs("Resolving globalAssetlist from gaiaHub")
    public getGlobalAssetList = async (): Promise<object> => {
        const blockstackId = `${this.settingsDomain}.id`;
        return await this.blockstackNameservice.getContentFromGaiaHub(blockstackId, "asset-list.json");
    }

    @utils.groupLogs("Resolving clientAssetMapping from gaiaHub")
    public getClientConfig = async (clientName: string): Promise<any> => {
        const blockstackId = new identityUtils.BlockstackId({
            domain: this.settingsDomain,
            subdomain: clientName,
        }).toString();
        return await this.blockstackNameservice.getContentFromGaiaHub(blockstackId, "client-config.json");
    }

    public getClientAssetMapping = async (): Promise<object> => {
        const clientConfig = await this.clientConfig;
        if (clientConfig.assetMapping) {
            return clientConfig.assetMapping;
        } else {
            return {};
        }
    }

    public getBlockstackServiceForConfig = async (): Promise<BlockstackService> => {
        if (!this.clientConfig) { throw ErrorHelper.getPackageError(PackageErrorCode.CouldNotFindBlockstackConfigurationServiceClientConfig); }
        let ns: nameservice.BlockstackService;
        if (this.clientConfig.nameserviceConfiguration) {
            ns = new nameservice.BlockstackService(this.clientConfig.nameserviceConfiguration);
        } else {
            ns = new nameservice.BlockstackService();
        }
        return ns;
    }

    public getVirtualAddressFromClientName = (clientName: string): string => {
        return clientName +  "." + this.settingsDomain;
    }

}
