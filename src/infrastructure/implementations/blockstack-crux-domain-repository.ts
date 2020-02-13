import { CruxDomain, IClientConfig } from "../../core/entities/crux-domain";
import { DomainRegistrationStatus } from "../../core/entities/crux-domain";
import { CruxSpec } from "../../core/entities/crux-spec";
import { ICruxBlockstackInfrastructure } from "../../core/interfaces";
import { ICruxDomainRepository, ICruxDomainRepositoryOptions } from "../../core/interfaces/crux-domain-repository";
import { IKeyManager } from "../../core/interfaces/key-manager";
import { ErrorHelper, PackageErrorCode } from "../../packages/error";
import { CruxDomainId } from "../../packages/identity-utils";
import { getLogger } from "../../packages/logger";
import { StorageService } from "../../packages/storage";
import { BlockstackService } from "../services/blockstack-service";
import { GaiaService } from "../services/gaia-service";
const log = getLogger(__filename);
export interface IBlockstackCruxDomainRepositoryOptions extends ICruxDomainRepositoryOptions {
    blockstackInfrastructure: ICruxBlockstackInfrastructure;
    cacheStorage?: StorageService;
}
export class BlockstackCruxDomainRepository implements ICruxDomainRepository {
    private cacheStorage?: StorageService;
    private infrastructure: ICruxBlockstackInfrastructure;
    private blockstackService: BlockstackService;
    constructor(options: IBlockstackCruxDomainRepositoryOptions) {
        this.cacheStorage = options.cacheStorage;
        this.infrastructure = options.blockstackInfrastructure;
        this.blockstackService = new BlockstackService({
            bnsNodes: this.infrastructure.bnsNodes,
            cacheStorage: this.cacheStorage,
            subdomainRegistrar: this.infrastructure.subdomainRegistrar,
        });
        log.debug("BlockstackCruxDomainRepository initialised");
    }
    public isCruxDomainIdAvailable = async (cruxDomainId: CruxDomainId): Promise<boolean> => {
        const domainRegistrationStatus = await this.blockstackService.getDomainRegistrationStatus(cruxDomainId);
        return domainRegistrationStatus === DomainRegistrationStatus.AVAILABLE;
    }
    public create = async (cruxDomainId: CruxDomainId, identityKeyManager: IKeyManager): Promise<CruxDomain> => {
        // TODO: register the domain on bitcoin blockchain and _config subdomain on domain provided SubdomainRegistrar service
        throw ErrorHelper.getPackageError(null, PackageErrorCode.IsNotSupported);
    }
    public get = async (cruxDomainId: CruxDomainId): Promise<CruxDomain|undefined> => {
        const domainRegistrationStatus = await this.blockstackService.getDomainRegistrationStatus(cruxDomainId);
        if (domainRegistrationStatus === DomainRegistrationStatus.AVAILABLE) {
            return;
        }
        const domainClientConfig = await this.getClientConfig(cruxDomainId);
        return new CruxDomain(cruxDomainId, domainRegistrationStatus, domainClientConfig);
    }
    public save = async (cruxDomain: CruxDomain, configKeyManager: IKeyManager): Promise<CruxDomain> => {
        const newConfig: IClientConfig = {
            assetList: CruxSpec.globalAssetList.filter((asset) => {
                return Object.values(cruxDomain.config.assetMapping).includes(asset.assetId);
            }),
            assetMapping: cruxDomain.config.assetMapping,
            nameserviceConfiguration: cruxDomain.config.nameserviceConfiguration,
            supportedParentAssetFallbacks: cruxDomain.config.supportedParentAssetFallbacks,
        };
        await this.putClientConfig(cruxDomain.id, newConfig, configKeyManager);
        return cruxDomain;
    }
    public getWithConfigKeyManager = async (keyManager: IKeyManager, cruxDomainId?: CruxDomainId): Promise<CruxDomain|undefined> => {
        const associatedDomainId = await this.blockstackService.getCruxDomainIdWithConfigKeyManager(keyManager, cruxDomainId);
        if (!associatedDomainId) {
            return;
        }
        const domainClientConfig = await this.getClientConfig(associatedDomainId);
        // TODO: add fallback assetList from the CruxSpec if asset list is not available from the domainConfig
        return new CruxDomain(associatedDomainId, DomainRegistrationStatus.REGISTERED, domainClientConfig);
    }
    private getClientConfig = async (cruxDomainId: CruxDomainId): Promise<IClientConfig> => {
        const configCruxId = CruxSpec.blockstack.getConfigCruxId(cruxDomainId);
        const domainConfigFileName = CruxSpec.blockstack.getDomainConfigFileName(cruxDomainId);
        const gaiaHub = await this.blockstackService.getGaiaHub(configCruxId);
        const configNameDetails = await this.blockstackService.getNameDetails(configCruxId);
        if (!configNameDetails.address) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.MissingNameOwnerAddress, configCruxId.toString());
        }
        return new GaiaService(gaiaHub, this.cacheStorage).getContentFromGaiaHub(configNameDetails.address, domainConfigFileName);
    }
    private putClientConfig = async (cruxDomainId: CruxDomainId, clientConfig: IClientConfig, keyManager: IKeyManager): Promise<string> => {
        const configCruxId = CruxSpec.blockstack.getConfigCruxId(cruxDomainId);
        const domainConfigFileName = CruxSpec.blockstack.getDomainConfigFileName(cruxDomainId);
        const gaiaHub = await this.blockstackService.getGaiaHub(configCruxId);
        const finalURL = await new GaiaService(gaiaHub, this.cacheStorage).uploadContentToGaiaHub(domainConfigFileName, clientConfig, keyManager);
        log.debug(`clientConfig saved to: ${finalURL}`);
        return finalURL;
    }
}
