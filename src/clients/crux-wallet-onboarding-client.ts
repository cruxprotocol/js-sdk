import { DomainRegistrationStatus } from "../core/entities/crux-domain";
import { CruxDomain } from "../core/entities/crux-domain";
import { ICruxDomainRepository } from "../core/interfaces/crux-domain-repository";
import { IKeyManager } from "../core/interfaces/key-manager";
import { BasicKeyManager } from "../infrastructure/implementations/basic-key-manager";
import { BlockstackCruxDomainRepository } from "../infrastructure/implementations/blockstack-crux-domain-repository";
import { IClientAssetMapping, IGlobalAssetList } from "../packages/configuration-service";
import { ErrorHelper, PackageErrorCode } from "../packages/error";
import { CruxDomainId } from "../packages/identity-utils";
import { InMemStorage } from "../packages/inmem-storage";
import { getLogger } from "../packages/logger";
import { IBlockstackServiceInputOptions } from "../packages/name-service/blockstack-service";
import { StorageService } from "../packages/storage";
const log = getLogger(__filename);
// DDD Experimental Stuff
export interface ICruxOnBoardingClientOptions {
    cacheStorage?: StorageService;
    configKey?: string|IKeyManager;
    domain?: string;
}
export class CruxOnBoardingClient {
    private cacheStorage?: StorageService;
    private initPromise: Promise<void>;
    private cruxDomainRepository: ICruxDomainRepository;
    private configKeyManager?: IKeyManager;
    private cruxDomain?: CruxDomain;
    private domainContext?: CruxDomainId;
    constructor(options: ICruxOnBoardingClientOptions) {
        this.cacheStorage = options.cacheStorage || new InMemStorage();
        // set the repository constructors to be used further in the client
        this.cruxDomainRepository = new BlockstackCruxDomainRepository({cacheStorage: this.cacheStorage});
        // set the keyManagers if available
        this.configKeyManager =  typeof options.configKey === "string" ? new BasicKeyManager(options.configKey) : options.configKey;
        // set the domainContext if domain is provided
        this.domainContext = options.domain ? new CruxDomainId(options.domain) : undefined;
        this.initPromise = this.init();
        log.info("CruxOnBoardingClient initialised");
    }
    set domain(domain: string) {
        this.domainContext = new CruxDomainId(domain);
    }
    public isCruxDomainAvailable = async (domain: string): Promise<boolean> => {
        return this.cruxDomainRepository.find(new CruxDomainId(domain));
    }
    public registerCruxDomain = async (domain: string): Promise<void> => {
        // TODO: implementation of auto registration of domain on blockchain
        throw ErrorHelper.getPackageError(null, PackageErrorCode.IsNotSupported);
    }
    public getCruxDomainState = async (): Promise<DomainRegistrationStatus> => {
        await this.initPromise;
        return this.getCruxDomain().status;
    }
    public getNameServiceConfig = async (): Promise<IBlockstackServiceInputOptions|undefined> => {
        await this.initPromise;
        return this.getCruxDomain().config.nameserviceConfiguration;
    }
    public getAssetMapping = async (): Promise<IClientAssetMapping> => {
        await this.initPromise;
        return this.getCruxDomain().config.assetMapping;
    }
    public getAssetList = async (): Promise<IGlobalAssetList> => {
        await this.initPromise;
        return this.getCruxDomain().config.assetList;
    }
    public putNameServiceConfig = async (newNameServiceConfig: IBlockstackServiceInputOptions): Promise<void> => {
        await this.initPromise;
        const cruxDomain = this.getCruxDomain();
        cruxDomain.config.nameserviceConfiguration = newNameServiceConfig;
        this.cruxDomain = await this.cruxDomainRepository.save(cruxDomain, this.getConfigKeyManager());
        return;
    }
    public putAssetMapping = async (newAssetMapping: IClientAssetMapping): Promise<void> => {
        await this.initPromise;
        const cruxDomain = this.getCruxDomain();
        cruxDomain.config.assetMapping = newAssetMapping;
        this.cruxDomain = await this.cruxDomainRepository.save(cruxDomain, this.getConfigKeyManager());
        return;
    }
    public putAssetList = async (newAssetList: IGlobalAssetList): Promise<void> => {
        await this.initPromise;
        const cruxDomain = this.getCruxDomain();
        cruxDomain.config.assetList = newAssetList;
        this.cruxDomain = await this.cruxDomainRepository.save(cruxDomain, this.getConfigKeyManager());
        return;
    }
    private init = async (): Promise<void> => {
        await this.restoreCruxDomain();
    }
    private getCruxDomain = (): CruxDomain => {
        if (!this.cruxDomain) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.MissingCruxDomain);
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
        this.cruxDomain = await this.cruxDomainRepository.getWithKey(this.getConfigKeyManager(), this.domainContext);
    }
}
