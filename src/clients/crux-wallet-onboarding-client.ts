import { DomainRegistrationStatus } from "../core/entities/crux-domain";
import { CruxDomain } from "../core/entities/crux-domain";
import { ICruxDomainRepository } from "../core/interfaces/crux-domain-repository";
import { IKeyManager } from "../core/interfaces/key-manager";
import { setCacheStorage } from "../index";
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
    private _initPromise: Promise<void>;
    private _cruxDomainRepository: ICruxDomainRepository;
    private _configKeyManager?: IKeyManager;
    private _cruxDomain?: CruxDomain;
    private _domainContext?: CruxDomainId;
    constructor(options: ICruxOnBoardingClientOptions) {
        setCacheStorage(options.cacheStorage || new InMemStorage());
        // set the repository constructors to be used further in the client
        this._cruxDomainRepository = new BlockstackCruxDomainRepository();
        // set the keyManagers if available
        this._configKeyManager =  typeof options.configKey === "string" ? new BasicKeyManager(options.configKey) : options.configKey;
        // set the domainContext if domain is provided
        this._domainContext = options.domain ? new CruxDomainId(options.domain) : undefined;
        this._initPromise = this._init();
        log.info("CruxOnBoardingClient initialised");
    }
    set domain(domain: string) {
        this._domainContext = new CruxDomainId(domain);
    }
    public isCruxDomainAvailable = async (domain: string): Promise<boolean> => {
        return this._cruxDomainRepository.find(new CruxDomainId(domain));
    }
    public registerCruxDomain = async (domain: string): Promise<void> => {
        // TODO: implementation of auto registration of domain on blockchain
        throw ErrorHelper.getPackageError(null, PackageErrorCode.IsNotSupported);
    }
    public getCruxDomainState = async (): Promise<DomainRegistrationStatus> => {
        await this._initPromise;
        return this._getCruxDomain().status;
    }
    public getNameServiceConfig = async (): Promise<IBlockstackServiceInputOptions|undefined> => {
        await this._initPromise;
        return this._getCruxDomain().config.nameserviceConfiguration;
    }
    public getAssetMapping = async (): Promise<IClientAssetMapping> => {
        await this._initPromise;
        return this._getCruxDomain().config.assetMapping;
    }
    public getAssetList = async (): Promise<IGlobalAssetList> => {
        await this._initPromise;
        return this._getCruxDomain().config.assetList;
    }
    public putNameServiceConfig = async (newNameServiceConfig: IBlockstackServiceInputOptions): Promise<void> => {
        await this._initPromise;
        const cruxDomain = this._getCruxDomain();
        cruxDomain.config.nameserviceConfiguration = newNameServiceConfig;
        this._cruxDomain = await this._cruxDomainRepository.save(cruxDomain, this._getConfigKeyManager());
        return;
    }
    public putAssetMapping = async (newAssetMapping: IClientAssetMapping): Promise<void> => {
        await this._initPromise;
        const cruxDomain = this._getCruxDomain();
        cruxDomain.config.assetMapping = newAssetMapping;
        this._cruxDomain = await this._cruxDomainRepository.save(cruxDomain, this._getConfigKeyManager());
        return;
    }
    public putAssetList = async (newAssetList: IGlobalAssetList): Promise<void> => {
        await this._initPromise;
        const cruxDomain = this._getCruxDomain();
        cruxDomain.config.assetList = newAssetList;
        this._cruxDomain = await this._cruxDomainRepository.save(cruxDomain, this._getConfigKeyManager());
        return;
    }
    private _init = async (): Promise<void> => {
        await this._restoreCruxDomain();
    }
    private _getCruxDomain = (): CruxDomain => {
        if (!this._cruxDomain) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.MissingCruxDomain);
        }
        return this._cruxDomain;
    }
    private _getConfigKeyManager = (): IKeyManager => {
        if (!this._configKeyManager) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.ConfigKeyManagerRequired);
        }
        return this._configKeyManager;
    }
    private _restoreCruxDomain = async (): Promise<void> => {
        this._cruxDomain = await this._cruxDomainRepository.getWithKey(this._getConfigKeyManager(), this._domainContext);
    }
}
