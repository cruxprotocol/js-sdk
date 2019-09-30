import { getLogger } from "..";
import config from "../config";
import {ErrorHelper, PackageErrorCode} from "./error";
import * as identityUtils from "./identity-utils";
import * as nameservice from "./nameservice";

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

    public getGlobalAssetList = async (): Promise<object> => {
        const clientConfig = await this.clientConfig;
        if (clientConfig && clientConfig.assetList) {
            return clientConfig.assetList;
        } else {
            { throw ErrorHelper.getPackageError(PackageErrorCode.CouldNotFindAssetListInClientConfig); }
        }
    }

    public getClientConfig = async (clientName: string): Promise<any> => {
        const blockstackId = new identityUtils.BlockstackId({
            domain: this.settingsDomain,
            subdomain: clientName,
        }).toString();
        return await this.blockstackNameservice.getContentFromGaiaHub(blockstackId, nameservice.UPLOADABLE_JSON_FILES.CLIENT_CONFIG);
    }

    public getClientAssetMapping = async (): Promise<object> => {
        const clientConfig = await this.clientConfig;
        if (clientConfig.assetMapping) {
            return clientConfig.assetMapping;
        } else {
            return {};
        }
    }

    public getBlockstackServiceForConfig = async (): Promise<nameservice.BlockstackService> => {
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
