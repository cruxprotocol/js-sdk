import { CruxDomain } from "../../core/entities/crux-domain";
import { DomainRegistrationStatus } from "../../core/entities/crux-domain";
import { CruxSpec } from "../../core/entities/crux-spec";
import { ICruxBlockstackInfrastructure } from "../../core/interfaces";
import { ICruxDomainRepository, ICruxDomainRepositoryOptions } from "../../core/interfaces/crux-domain-repository";
import { IKeyManager } from "../../core/interfaces/key-manager";
import { IClientConfig } from "../../packages/configuration-service";
import { ErrorHelper, PackageErrorCode } from "../../packages/error";
import { CruxDomainId } from "../../packages/identity-utils";
import { getLogger } from "../../packages/logger";
import { StorageService } from "../../packages/storage";
import { BlockstackService } from "../services/blockstack-service";
const log = getLogger(__filename);
export interface IBlockstackCruxDomainRepositoryOptions extends ICruxDomainRepositoryOptions {
    blockstackInfrastructure: ICruxBlockstackInfrastructure;
    cacheStorage?: StorageService;
}
export class BlockstackCruxDomainRepository implements ICruxDomainRepository {
    private blockstackService: BlockstackService;
    constructor(options: IBlockstackCruxDomainRepositoryOptions) {
        this.blockstackService = new BlockstackService({
            cacheStorage: options.cacheStorage,
            infrastructure: options.blockstackInfrastructure,
        });
        log.info("BlockstackCruxDomainRepository initialised");
    }
    public find = async (domainId: CruxDomainId): Promise<boolean> => {
        const domainRegistrationStatus = await this.blockstackService.getDomainRegistrationStatus(domainId.components.domain);
        return domainRegistrationStatus === DomainRegistrationStatus.AVAILABLE;
    }
    public create = async (domainId: CruxDomainId, identityKeyManager: IKeyManager): Promise<CruxDomain> => {
        // TODO: register the domain on bitcoin blockchain and _config subdomain on domain provided SubdomainRegistrar service
        throw ErrorHelper.getPackageError(null, PackageErrorCode.IsNotSupported);
    }
    public get = async (domainId: CruxDomainId): Promise<CruxDomain|undefined> => {
        const domainRegistrationStatus = await this.blockstackService.getDomainRegistrationStatus(domainId.components.domain);
        if (domainRegistrationStatus === DomainRegistrationStatus.AVAILABLE) {
            return;
        }
        const domainClientConfig = await this.blockstackService.getClientConfig(domainId.components.domain);
        return new CruxDomain(domainId, domainRegistrationStatus, domainClientConfig);
    }
    public save = async (cruxDomain: CruxDomain, configKeyManager: IKeyManager): Promise<CruxDomain> => {
        const newConfig: IClientConfig = {
            assetList: CruxSpec.globalAssetList.filter((asset) => {
                return Object.values(cruxDomain.config.assetMapping).includes(asset.assetId);
            }),
            assetMapping: cruxDomain.config.assetMapping,
            nameserviceConfiguration: cruxDomain.config.nameserviceConfiguration,
        };
        await this.blockstackService.putClientConfig(cruxDomain.domainId.components.domain, newConfig, configKeyManager);
        return cruxDomain;
    }
    public getWithConfigKeyManager = async (keyManager: IKeyManager, domainId?: CruxDomainId): Promise<CruxDomain|undefined> => {
        const associatedDomain = await this.blockstackService.restoreDomain(keyManager, domainId && domainId.components.domain);
        if (!associatedDomain) {
            return;
        }
        const domainClientConfig = await this.blockstackService.getClientConfig(associatedDomain);
        return new CruxDomain(new CruxDomainId(associatedDomain), DomainRegistrationStatus.REGISTERED, domainClientConfig);
    }
}
