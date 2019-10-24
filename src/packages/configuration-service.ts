import { getLogger } from "..";
import config from "../config";
import { ErrorHelper, PackageErrorCode } from "./error";
import { getContentFromGaiaHub, getGaiaDataFromBlockstackID } from "./gaia-service/utils";
import * as identityUtils from "./identity-utils";
import { IIdentityClaim } from "./name-service";
import * as blockstackService from "./name-service/blockstack-service";
import { IBlockstackServiceInputOptions } from "./name-service/blockstack-service";
import { getCruxIDByAddress } from "./name-service/utils";

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

export class ConfigurationService {

    public clientName: string;
    public clientConfig?: IClientConfig;
    public globalAssetMap?: IGlobalMap;
    public clientAssetMapping?: IClientAssetMapping;
    public reverseClientAssetMapping?: IReverseClientAssetMapping;
    public resolvedClientAssetMap?: IResolvedClientAssetMap;
    public nameServiceConfig?: IBlockstackServiceInputOptions;

    constructor(clientName: string) {
        this.clientName = clientName;
        log.info(`BlockstackConfigurationService initialised with default configs`);
    }

    public init = async () => {
        await this._setupClientConfig()
            .then(() => Promise.all([
                this._setupGlobalAseetMap(),
                this._setupClientAssetMapping(),
                this._setupNameServiceConfig(),
            ]))
            .then(() => this._setupReverseClientAssetMapping())
            .then(() => this._setupResolvedClientAssetMapping());
    }

    public getBlockstackServiceForConfig = async (userCruxID?: string, identityClaim?: IIdentityClaim): Promise<blockstackService.BlockstackService> => {
        if (!(this.clientConfig && this.nameServiceConfig)) {
            throw ErrorHelper.getPackageError(PackageErrorCode.ClientNotInitialized);
        }
        let nsConfig = this.nameServiceConfig;

        // Merging user level configuration overrides if available (will be overriding the temporary in-memory variable)
        if (userCruxID && identityClaim) {
            // Get the user name registration status
            const ns: blockstackService.BlockstackService = new blockstackService.BlockstackService(nsConfig);
            await ns.restoreIdentity(userCruxID, identityClaim);
            const status = await ns.getRegistrationStatus(identityClaim);

            if (status.status === blockstackService.SubdomainRegistrationStatus.DONE) {
                const userBlockstackID = identityUtils.IdTranslator.cruxToBlockstack(identityUtils.CruxId.fromString(userCruxID)).toString();
                const gaiaUrls = await getGaiaDataFromBlockstackID(userBlockstackID, (this.clientConfig.nameserviceConfiguration && this.clientConfig.nameserviceConfiguration.bnsNodes) || config.BLOCKSTACK.BNS_NODES);
                const gaiaHub = gaiaUrls.gaiaWriteUrl;
                nsConfig = Object.assign(this.nameServiceConfig, {gaiaHub});
            }
        }
        return new blockstackService.BlockstackService(nsConfig);
    }

    public translateSymbolToAssetId = async (currencySymbol: string): Promise<string> => {
        return (this.clientAssetMapping as IClientAssetMapping)[currencySymbol];
    }

    public translateAssetIdToSymbol = async (assetId: string): Promise<string> => {
        return (this.reverseClientAssetMapping as IReverseClientAssetMapping)[assetId];
    }

    public getCruxIDByAddress = async (address: string) => {
        if (!this.clientConfig) {
            throw ErrorHelper.getPackageError(PackageErrorCode.ClientNotInitialized);
        }
        const walletNameServiceConfiguration = this.clientConfig.nameserviceConfiguration;
        const bnsNodes = (walletNameServiceConfiguration && walletNameServiceConfiguration.bnsNodes) ? [...new Set([...config.BLOCKSTACK.BNS_NODES, ...walletNameServiceConfiguration.bnsNodes])] : config.BLOCKSTACK.BNS_NODES;
        const registrar = (walletNameServiceConfiguration && walletNameServiceConfiguration.subdomainRegistrar) || config.BLOCKSTACK.SUBDOMAIN_REGISTRAR;
        return await getCruxIDByAddress(this.clientName, address, bnsNodes, registrar);
    }

    private _setupNameServiceConfig = async () => {
        if (!this.clientConfig) {
            throw ErrorHelper.getPackageError(PackageErrorCode.CouldNotFindBlockstackConfigurationServiceClientConfig);
        }

        // Default configurations
        const nsConfiguration: IBlockstackServiceInputOptions = {
            bnsNodes: config.BLOCKSTACK.BNS_NODES,
            domain: this.clientName + identityUtils.CRUX_DOMAIN_SUFFIX,
            gaiaHub: config.BLOCKSTACK.GAIA_HUB,
            subdomainRegistrar: config.BLOCKSTACK.SUBDOMAIN_REGISTRAR,
        };

        // Merging wallet level configuration overrides if available (will be overriding the class property)
        if (this.clientConfig.nameserviceConfiguration) {
            if (this.clientConfig.nameserviceConfiguration.bnsNodes) {
                // always append the extra configured BNS nodes (needs `downlevelIteration` flag enabled in tsconfig.json)
                nsConfiguration.bnsNodes = [...new Set([...config.BLOCKSTACK.BNS_NODES, ...this.clientConfig.nameserviceConfiguration.bnsNodes])];
            }
            if (this.clientConfig.nameserviceConfiguration.gaiaHub) {
                nsConfiguration.gaiaHub = this.clientConfig.nameserviceConfiguration.gaiaHub;
            }
            if (this.clientConfig.nameserviceConfiguration.subdomainRegistrar) {
                nsConfiguration.subdomainRegistrar = this.clientConfig.nameserviceConfiguration.subdomainRegistrar;
            }
        }
        this.nameServiceConfig = nsConfiguration;
    }

    private _setupClientConfig = async (): Promise<void> => {
        const blockstackId = new identityUtils.BlockstackId({
            domain: this.clientName + identityUtils.CRUX_DOMAIN_SUFFIX,
            subdomain: CONFIG_SUBDOMAIN,
        }).toString();
        this.clientConfig = await getContentFromGaiaHub(blockstackId, blockstackService.UPLOADABLE_JSON_FILES.CLIENT_CONFIG, config.BLOCKSTACK.BNS_NODES, this.clientName);
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
