import { getLogger, IAddressMapping } from "..";
import config from "../config";
import { ErrorHelper, PackageErrorCode } from "./error";
import { getContentFromGaiaHub, getGaiaDataFromBlockstackID } from "./gaia-service/utils";
import * as identityUtils from "./identity-utils";
import * as nameservice from "./name-service/blockstack-service";
import { IBlockstackServiceInputOptions } from "./name-service/blockstack-service";

const log = getLogger(__filename);
const CONFIG_SUBDOMAIN = "_config";

interface IGlobalAsset {
    assetId: string;
    symbol: string;
    name: string;
    assetType: string;
    decimals: number;
    assetIdentifierName: string;
    assetIdentifierValue: string;
    parentAssetId: string;
}

interface IGlobalAssetList extends Array<IGlobalAsset> {}

interface IGlobalMapping {
    [assetId: string]: IGlobalAsset;
}

interface IClientAssetMapping {
    [currencySymbol: string]: string;
}

interface IClientConfig {
    assetMapping: IClientAssetMapping;
    assetList: IGlobalAssetList;
    nameserviceConfiguration: IBlockstackServiceInputOptions;
}

export interface IResolvedClientAssetMapping {
    [currencySymbol: string]: IGlobalAsset;
}

export abstract class NameServiceConfigurationService {
    constructor() {
        log.info(`Initizing NameServiceConfigurationService with options:- `);
    }

    public abstract getResolvedClientAssetMapping = async (): Promise<any> => ({});
    public abstract translateSymbolToAssetId = async (assetId: string): Promise<string> => ("");
    public abstract translateAssetIdToSymbol = async (currencySymbol: string): Promise<string> => ("");
}

export class BlockstackConfigurationService extends NameServiceConfigurationService {

    private reverseClientAssetMapping?: object;
    private blockstackNameservice: nameservice.BlockstackService;
    private clientName: string;
    private clientConfig?: IClientConfig;
    private clientAssetMapping?: IClientAssetMapping;
    private blockstackID: string | undefined;
    private globalMapping?: IGlobalMapping;

    constructor(clientName: string, cruxID?: string) {
        super();
        this.clientName = clientName;
        if (cruxID) {
            this.blockstackID = identityUtils.IdTranslator.cruxToBlockstack(identityUtils.CruxId.fromString(cruxID)).toString();
        }
        this.blockstackNameservice = new nameservice.BlockstackService({ domain: this.clientName + identityUtils.CRUX_DOMAIN_SUFFIX });
        log.info(`BlockstackConfigurationService initialised with default configs`);
    }

    public init = async () => {
        this.clientConfig = await this._getClientConfig();
        this.globalMapping = await this._getGlobalMapping();
        this.clientAssetMapping = await this._getClientAssetMapping();
        this.reverseClientAssetMapping = await this._getReverseClientAssetMapping();
    }

    public getResolvedClientAssetMapping = async (): Promise<any> => {
        const resolvedClientAssetMapping: IResolvedClientAssetMapping = {};
        if (this.globalMapping && this.clientConfig && this.clientConfig.assetMapping) {
            for (const currencySymbol of Object.keys(this.clientConfig.assetMapping)) {
                if (this.globalMapping[this.clientConfig.assetMapping[currencySymbol]]) {
                    resolvedClientAssetMapping[currencySymbol] = this.globalMapping[this.clientConfig.assetMapping[currencySymbol]];
                }
            }
        }
        return resolvedClientAssetMapping;
    }

    public getBlockstackServiceForConfig = async (): Promise<nameservice.BlockstackService> => {
        if (!this.clientConfig) { throw ErrorHelper.getPackageError(PackageErrorCode.CouldNotFindBlockstackConfigurationServiceClientConfig); }
        let ns: nameservice.BlockstackService;
        let gaiaHub: string | undefined;
        if (this.blockstackID) {
            const gaiaUrls = await getGaiaDataFromBlockstackID(this.blockstackID, (this.clientConfig.nameserviceConfiguration && this.clientConfig.nameserviceConfiguration.bnsNodes) || config.BLOCKSTACK.BNS_NODES);
            gaiaHub = gaiaUrls.gaiaWriteUrl;
        }
        const domain = this.clientName + identityUtils.CRUX_DOMAIN_SUFFIX;
        const nsConfiguration: IBlockstackServiceInputOptions = {
            domain,
            gaiaHub,
        };
        if (this.clientConfig.nameserviceConfiguration) {
            nsConfiguration.bnsNodes = this.clientConfig.nameserviceConfiguration.bnsNodes;
            nsConfiguration.domain = domain;
            nsConfiguration.gaiaHub = gaiaHub || this.clientConfig.nameserviceConfiguration.gaiaHub;
            nsConfiguration.subdomainRegistrar = this.clientConfig.nameserviceConfiguration.subdomainRegistrar;
        }
        ns = new nameservice.BlockstackService(nsConfiguration);
        return ns;
    }

    public translateSymbolToAssetId = async (currencySymbol: string): Promise<string> => {
        return (this.clientAssetMapping as IClientAssetMapping)[currencySymbol];
    }

    public translateAssetIdToSymbol = async (assetId: string): Promise<string> => {
        return (this.reverseClientAssetMapping as IClientAssetMapping)[assetId];
    }

    private _getGlobalMapping = async (): Promise<IGlobalMapping> => {
        const clientConfig = this.clientConfig;
        const globalMapping: IGlobalMapping = {};
        if (clientConfig && clientConfig.assetList) {
            clientConfig.assetList.forEach((asset) => {
                globalMapping[asset.assetId] = asset;
            });
            return globalMapping;
        } else {
            throw ErrorHelper.getPackageError(PackageErrorCode.CouldNotFindAssetListInClientConfig);
        }
    }

    private _getClientConfig = async (): Promise<IClientConfig> => {
        const blockstackId = new identityUtils.BlockstackId({
            domain: this.clientName + identityUtils.CRUX_DOMAIN_SUFFIX,
            subdomain: CONFIG_SUBDOMAIN,
        }).toString();
        return await getContentFromGaiaHub(blockstackId, nameservice.UPLOADABLE_JSON_FILES.CLIENT_CONFIG, config.BLOCKSTACK.BNS_NODES, this.clientName);
    }

    private _getClientAssetMapping = async (): Promise<IClientAssetMapping> => {
        const clientConfig = this.clientConfig;
        const lowerAssetMapping: any = {};
        if (clientConfig && clientConfig.assetMapping) {
            for (const walletCurrencySymbol of Object.keys(clientConfig.assetMapping)) {
                lowerAssetMapping[walletCurrencySymbol.toLowerCase()] = clientConfig.assetMapping[walletCurrencySymbol];
            }
            return lowerAssetMapping;
        } else {
            return {};
        }
    }

    private _getReverseClientAssetMapping = async (): Promise<object> => {
        const assetIdToWalletCurrencySymbolMap: {[assetId: string]: string} = {};
        if (this.clientAssetMapping) {
            for (let walletCurrencySymbol of Object.keys(this.clientAssetMapping)) {
                walletCurrencySymbol = walletCurrencySymbol.toLowerCase();
                assetIdToWalletCurrencySymbolMap[this.clientAssetMapping[walletCurrencySymbol]] = walletCurrencySymbol;
            }
            return assetIdToWalletCurrencySymbolMap;
        } else {
            return {};
        }
    }

}
