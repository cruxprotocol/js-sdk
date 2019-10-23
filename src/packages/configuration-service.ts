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

interface IGlobalMap {
    [assetId: string]: IGlobalAsset;
}

interface IClientAssetMapping {
    [currencySymbol: string]: string;
}

interface IReverseClientAssetMapping {
    [assetId: string]: string;
}

export interface IClientConfig {
    assetMapping: IClientAssetMapping;
    assetList: IGlobalAssetList;
    nameserviceConfiguration?: IBlockstackServiceInputOptions;
}

export interface IResolvedClientAssetMap {
    [currencySymbol: string]: IGlobalAsset;
}

export abstract class NameServiceConfigurationService {
    constructor() {
        log.info(`Initizing NameServiceConfigurationService with options:- `);
    }

    public abstract translateSymbolToAssetId = async (currencySymbol: string): Promise<string> => ("");
    public abstract translateAssetIdToSymbol = async (assetId: string): Promise<string> => ("");
}

export class BlockstackConfigurationService extends NameServiceConfigurationService {

    public clientName: string;
    public clientConfig?: IClientConfig;
    public globalAssetMap?: IGlobalMap;
    public clientAssetMapping?: IClientAssetMapping;
    public reverseClientAssetMapping?: IReverseClientAssetMapping;
    public resolvedClientAssetMap?: IResolvedClientAssetMap;

    constructor(clientName: string) {
        super();
        this.clientName = clientName;
        log.info(`BlockstackConfigurationService initialised with default configs`);
    }

    public init = async () => {
        await this._setupClientConfig()
            .then(() => this._setupGlobalAseetMap())
            .then(() => this._setupClientAssetMapping())
            .then(() => this._setupReverseClientAssetMapping())
            .then(() => this._setupResolvedClientAssetMapping());
    }

    public getBlockstackServiceForConfig = async (userCruxID?: string): Promise<nameservice.BlockstackService> => {
        if (!this.clientConfig) { throw ErrorHelper.getPackageError(PackageErrorCode.CouldNotFindBlockstackConfigurationServiceClientConfig); }
        let ns: nameservice.BlockstackService;
        let gaiaHub: string | undefined;
        if (userCruxID) {
            const userBlockstackID = identityUtils.IdTranslator.cruxToBlockstack(identityUtils.CruxId.fromString(userCruxID)).toString();
            const gaiaUrls = await getGaiaDataFromBlockstackID(userBlockstackID, (this.clientConfig.nameserviceConfiguration && this.clientConfig.nameserviceConfiguration.bnsNodes) || config.BLOCKSTACK.BNS_NODES);
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
        return (this.reverseClientAssetMapping as IReverseClientAssetMapping)[assetId];
    }

    private _setupClientConfig = async (): Promise<void> => {
        const blockstackId = new identityUtils.BlockstackId({
            domain: this.clientName + identityUtils.CRUX_DOMAIN_SUFFIX,
            subdomain: CONFIG_SUBDOMAIN,
        }).toString();
        this.clientConfig = await getContentFromGaiaHub(blockstackId, nameservice.UPLOADABLE_JSON_FILES.CLIENT_CONFIG, config.BLOCKSTACK.BNS_NODES, this.clientName);
    }

    private _setupGlobalAseetMap = async (): Promise<void> => {
        const clientConfig = this.clientConfig;
        const globalMapping: IGlobalMap = {};
        if (clientConfig && clientConfig.assetList) {
            clientConfig.assetList.forEach((asset) => {
                globalMapping[asset.assetId] = asset;
            });
            this.globalAssetMap = globalMapping;
        } else {
            throw ErrorHelper.getPackageError(PackageErrorCode.CouldNotFindAssetListInClientConfig);
        }
    }

    private _setupClientAssetMapping = async (): Promise<void> => {
        const lowerAssetMapping: IClientAssetMapping = {};
        if (this.clientConfig && this.clientConfig.assetMapping) {
            for (const walletCurrencySymbol of Object.keys(this.clientConfig.assetMapping)) {
                lowerAssetMapping[walletCurrencySymbol.toLowerCase()] = this.clientConfig.assetMapping[walletCurrencySymbol];
            }
        }
        this.clientAssetMapping = lowerAssetMapping;
    }

    private _setupReverseClientAssetMapping = async (): Promise<void> => {
        const assetIdToWalletCurrencySymbolMap: IReverseClientAssetMapping = {};
        if (this.clientAssetMapping) {
            for (let walletCurrencySymbol of Object.keys(this.clientAssetMapping)) {
                walletCurrencySymbol = walletCurrencySymbol.toLowerCase();
                assetIdToWalletCurrencySymbolMap[this.clientAssetMapping[walletCurrencySymbol]] = walletCurrencySymbol;
            }
        }
        this.reverseClientAssetMapping = assetIdToWalletCurrencySymbolMap;
    }

    private _setupResolvedClientAssetMapping = async (): Promise<void> => {
        const resolvedClientAssetMapping: IResolvedClientAssetMap = {};
        if (this.globalAssetMap && this.clientConfig && this.clientConfig.assetMapping) {
            for (const currencySymbol of Object.keys(this.clientConfig.assetMapping)) {
                if (this.globalAssetMap[this.clientConfig.assetMapping[currencySymbol]]) {
                    resolvedClientAssetMapping[currencySymbol] = this.globalAssetMap[this.clientConfig.assetMapping[currencySymbol]];
                }
            }
        }
        this.resolvedClientAssetMap = resolvedClientAssetMapping;
    }

}
