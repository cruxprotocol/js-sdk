export * from "./utils";
import { IClientAssetMapping } from "../../../core/entities/crux-domain";
import { DomainRegistrationStatus, INameServiceConfigurationOverrides } from "../../../core/entities/crux-domain";
import { CruxDomain } from "../../../core/entities/crux-domain";
import { CruxSpec } from "../../../core/entities/crux-spec";
import { ICruxBlockstackInfrastructure } from "../../../core/interfaces";
import { ICruxDomainRepository } from "../../../core/interfaces/crux-domain-repository";
import { IKeyManager } from "../../../core/interfaces/key-manager";
import { BasicKeyManager } from "../../../infrastructure/implementations/basic-key-manager";
import { BlockstackCruxDomainRepository } from "../../../infrastructure/implementations/blockstack-crux-domain-repository";
import { ErrorHelper, PackageErrorCode } from "../../../packages/error";
import { CruxDomainId } from "../../../packages/identity-utils";
import { InMemStorage } from "../../../packages/inmem-storage";
import { getLogger } from "../../../packages/logger";
import { StorageService } from "../../../packages/storage";
import { cloneValue } from "../../../packages/utils";
import { throwCruxOnBoardingClientError } from "./utils";
const log = getLogger(__filename);
// DDD Experimental Stuff
export interface ICruxOnBoardingClientOptions {
    cacheStorage?: StorageService;
    configKey?: string|IKeyManager;
    domain?: string;
    blockstackInfrastructure?: ICruxBlockstackInfrastructure;
}
export class CruxOnBoardingClient {
    private cacheStorage?: StorageService;
    private cruxBlockstackInfrastructure: ICruxBlockstackInfrastructure;
    private initPromise: Promise<void>;
    private cruxDomainRepository: ICruxDomainRepository;
    private configKeyManager?: IKeyManager;
    private cruxDomain?: CruxDomain;
    private domainContext?: CruxDomainId;
    constructor(options: ICruxOnBoardingClientOptions) {
        this.cacheStorage = options.cacheStorage || new InMemStorage();
        this.cruxBlockstackInfrastructure = options.blockstackInfrastructure || CruxSpec.blockstack.infrastructure;
        // set the repository constructors to be used further in the client
        this.cruxDomainRepository = new BlockstackCruxDomainRepository({
            blockstackInfrastructure: this.cruxBlockstackInfrastructure,
            cacheStorage: this.cacheStorage,
        });
        // set the keyManagers if available
        this.configKeyManager =  typeof options.configKey === "string" ? new BasicKeyManager(options.configKey) : options.configKey;
        // set the domainContext if domain is provided
        this.domainContext = options.domain ? new CruxDomainId(options.domain) : undefined;
        this.initPromise = this.init();
        log.debug("CruxOnBoardingClient initialised");
    }
    set domain(domain: string) {
        this.domainContext = new CruxDomainId(domain);
    }
    @throwCruxOnBoardingClientError
    public isCruxDomainAvailable = async (domain: string): Promise<boolean> => {
        return this.cruxDomainRepository.isCruxDomainIdAvailable(new CruxDomainId(domain));
    }
    @throwCruxOnBoardingClientError
    public registerCruxDomain = async (domain: string): Promise<void> => {
        // TODO: implementation of auto registration of domain on blockchain
        throw ErrorHelper.getPackageError(null, PackageErrorCode.IsNotSupported);
    }
    @throwCruxOnBoardingClientError
    public getCruxDomainState = async (): Promise<DomainRegistrationStatus> => {
        await this.initPromise;
        return this.getCruxDomain().status;
    }
    @throwCruxOnBoardingClientError
    public getNameServiceConfig = async (): Promise<INameServiceConfigurationOverrides|undefined> => {
        await this.initPromise;
        return this.getCruxDomain().config.nameserviceConfiguration;
    }
    @throwCruxOnBoardingClientError
    public getAssetMapping = async (): Promise<IClientAssetMapping> => {
        await this.initPromise;
        return this.getCruxDomain().config.assetMapping;
    }
    @throwCruxOnBoardingClientError
    public getSupportedAssetGroups = async (): Promise<string[]> => {
        await this.initPromise;
        return this.getCruxDomain().config.supportedAssetGroups;
    }
    @throwCruxOnBoardingClientError
    public putNameServiceConfig = async (newNameServiceConfig: INameServiceConfigurationOverrides): Promise<void> => {
        await this.initPromise;
        const cruxDomain = cloneValue(this.getCruxDomain());
        cruxDomain.config.nameserviceConfiguration = newNameServiceConfig;
        this.cruxDomain = await this.cruxDomainRepository.save(cruxDomain, this.getConfigKeyManager());
        return;
    }
    @throwCruxOnBoardingClientError
    public putAssetMapping = async (newAssetMapping: IClientAssetMapping): Promise<void> => {
        await this.initPromise;
        const cruxDomain: CruxDomain = cloneValue(this.getCruxDomain());
        cruxDomain.config.assetMapping = newAssetMapping;
        this.cruxDomain = await this.cruxDomainRepository.save(cruxDomain, this.getConfigKeyManager());
        return;
    }
    @throwCruxOnBoardingClientError
    public putSupportedAssetGroups = async (newSupportedAssetGroups: string[]): Promise<void> => {
        await this.initPromise;
        const cruxDomain: CruxDomain = cloneValue(this.getCruxDomain());
        cruxDomain.config.supportedAssetGroups = newSupportedAssetGroups;
        this.cruxDomain = await this.cruxDomainRepository.save(cruxDomain, this.getConfigKeyManager());
        return;
    }
    private init = async (): Promise<void> => {
        await this.restoreCruxDomain();
    }
    private getCruxDomain = (): CruxDomain => {
        if (!this.cruxDomain) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.MissingCruxDomainInCruxOnBoardingClient);
        }
        return this.cruxDomain;
    }
    private getConfigKeyManager = (): IKeyManager => {
        if (!this.configKeyManager) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.ConfigKeyManagerRequired);
        }
        return this.configKeyManager;
    }
    private restoreCruxDomain = async (): Promise<void> => {
        this.cruxDomain = await this.cruxDomainRepository.getWithConfigKeyManager(this.getConfigKeyManager(), this.domainContext);
    }
}
