import { getLogger } from "..";
import config from "../config";
import {ErrorHelper, PackageErrorCode} from "./error";
import { getContentFromGaiaHub, getGaiaDataFromBlockstackID } from "./gaia-service/utils";
import * as identityUtils from "./identity-utils";
import * as nameservice from "./name-service/blockstack-service";

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
    private blockstackID: string | undefined;

    constructor(clientName: string, cruxID?: string) {
        super();
        this.clientName = clientName;
        if (cruxID) {
            this.blockstackID = identityUtils.IdTranslator.cruxToBlockstack(identityUtils.CruxId.fromString(cruxID)).toString();
        }
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
            throw ErrorHelper.getPackageError(PackageErrorCode.CouldNotFindAssetListInClientConfig);
        }
    }

    public getClientConfig = async (clientName: string): Promise<any> => {
        const blockstackId = new identityUtils.BlockstackId({
            domain: this.settingsDomain,
            subdomain: clientName,
        }).toString();
        return await getContentFromGaiaHub(blockstackId, nameservice.UPLOADABLE_JSON_FILES.CLIENT_CONFIG, config.BLOCKSTACK.BNS_NODES, clientName);
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
        let gaiaHub: string | undefined;
        if (this.blockstackID) {
            const gaiaUrls = await getGaiaDataFromBlockstackID(this.blockstackID, (this.clientConfig.nameserviceConfiguration && this.clientConfig.nameserviceConfiguration.bnsNodes) || config.BLOCKSTACK.BNS_NODES);
            gaiaHub = gaiaUrls.gaiaWriteUrl;
        }
        if (this.clientConfig.nameserviceConfiguration) {
            const nsConfiguration = {
                bnsNodes: this.clientConfig.nameserviceConfiguration.bnsNodes || config.BLOCKSTACK.BNS_NODES,
                domain: this.clientName || config.BLOCKSTACK.IDENTITY_DOMAIN,
                gaiaHub: gaiaHub || this.clientConfig.nameserviceConfiguration.gaiaHub || config.BLOCKSTACK.GAIA_HUB,
                subdomainRegistrar: this.clientConfig.nameserviceConfiguration.subdomainRegistrar || config.BLOCKSTACK.SUBDOMAIN_REGISTRAR,
            };
            ns = new nameservice.BlockstackService(nsConfiguration);
        } else {
            if (gaiaHub) {
                ns = new nameservice.BlockstackService({gaiaHub});
            } else {
                ns = new nameservice.BlockstackService();
            }
        }
        return ns;
    }

}
