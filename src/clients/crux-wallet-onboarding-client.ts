import { CruxAssetTranslator } from "../core/entities/crux-asset-translator";
import { DomainRegistrationStatus } from "../core/entities/crux-domain";
import { CruxDomain } from "../core/entities/crux-domain";
import { ICruxAssetTranslatorRepository, ICruxAssetTranslatorRepositoryConstructor } from "../core/interfaces/crux-asset-translator-repository";
import { ICruxDomainRepository, ICruxDomainRepositoryConstructor } from "../core/interfaces/crux-domain-repository";
import { IKeyManager } from "../core/interfaces/key-manager";
import { setCacheStorage } from "../index";
import { BlockstackCruxAssetTranslatorRepository } from "../infrastructure/implementations/blockstack-crux-asset-translator-repository";
import { BlockstackCruxDomainRepository } from "../infrastructure/implementations/blockstack-crux-domain-repository";
import { ManualCruxAssetTranslatorRepository } from "../infrastructure/implementations/manual-crux-asset-translator-repository";
import { ManualKeyManager } from "../infrastructure/implementations/manual-key-manager";
import { IClientAssetMapping, IGlobalAssetList } from "../packages/configuration-service";
import { ErrorHelper, PackageErrorCode } from "../packages/error";
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
    assetMapping?: IClientAssetMapping;
}
export class CruxOnBoardingClient {
    private _initPromise: Promise<void>;
    private _cruxDomainRepository: ICruxDomainRepositoryConstructor;
    private _cruxAssetTranslatorRepository: ICruxAssetTranslatorRepositoryConstructor;
    private _configKeyManager?: IKeyManager;
    private _cruxDomain?: CruxDomain;
    private _cruxAssetTranslator?: CruxAssetTranslator;
    private _domainContext?: string;
    private _assetMapping?: IClientAssetMapping;
    constructor(options: ICruxOnBoardingClientOptions) {
        setCacheStorage(options.cacheStorage || new InMemStorage());
        // set the repository constructors to be used further in the client
        this._cruxDomainRepository = BlockstackCruxDomainRepository;
        this._cruxAssetTranslatorRepository = BlockstackCruxAssetTranslatorRepository;
        // set the keyManagers if available
        this._configKeyManager =  typeof options.configKey === "string" ? new ManualKeyManager(options.configKey) : options.configKey;
        // set the domainContext if domain is provided
        this._domainContext = options.domain;
        this._initPromise = this._init();
        log.info("CruxOnBoardingClient initialised");
    }
    set domain(domain: string) {
        this._domainContext = domain;
    }
    public isCruxDomainAvailable = async (domain: string): Promise<boolean> => {
        return this._getCruxDomainRepository().find(domain);
    }
    public registerCruxDomain = async (domain: string): Promise<void> => {
        // TODO: implementation of auto registration of domain on blockchain
        throw ErrorHelper.getPackageError(null, PackageErrorCode.IsNotSupported);
    }
    public getCruxDomainState = async (): Promise<DomainRegistrationStatus> => {
        await this._initPromise;
        return this._getCruxDomain().status;
    }
    public getNameServiceConfig = async () => {
        await this._initPromise;
        return this._getCruxDomain().nameServiceConfig;
    }
    public getAssetMapping = async (): Promise<IClientAssetMapping> => {
        await this._initPromise;
        return this._getCruxAssetTranslator().assetMapping;
    }
    public getAssetList = async (): Promise<IGlobalAssetList> => {
        await this._initPromise;
        return this._getCruxAssetTranslator().assetList;
    }
    public putNameServiceConfig = async (newNameServiceConfig: IBlockstackServiceInputOptions): Promise<void> => {
        await this._initPromise;
        const cruxDomain = this._getCruxDomain();
        cruxDomain.nameServiceConfig = newNameServiceConfig;
        this._cruxDomain = await this._getCruxDomainRepository().save(cruxDomain, this._getConfigKeyManager());
        return;
    }
    public putAssetMapping = async (newAssetMapping: IClientAssetMapping): Promise<void> => {
        await this._initPromise;
        const cruxAssetTranslator = this._getCruxAssetTranslator();
        cruxAssetTranslator.assetMapping = newAssetMapping;
        this._cruxAssetTranslator = await this._getCruxAssetTranslatorRepository().save(cruxAssetTranslator, this._getConfigKeyManager());
        return;
    }
    public putAssetList = async (newAssetList: IGlobalAssetList): Promise<void> => {
        await this._initPromise;
        const cruxAssetTranslator = this._getCruxAssetTranslator();
        cruxAssetTranslator.assetList = newAssetList;
        this._cruxAssetTranslator = await this._getCruxAssetTranslatorRepository().save(cruxAssetTranslator, this._getConfigKeyManager());
        return;
    }
    private _init = async (): Promise<void> => {
        await this._restoreCruxDomain();
        await this._restoreCruxAssetTranslator();
    }
    private _getCruxDomain = (): CruxDomain => {
        if (!this._cruxDomain) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.MissingCruxDomain);
        }
        return this._cruxDomain;
    }
    private _getCruxAssetTranslator = (): CruxAssetTranslator => {
        if (!this._cruxAssetTranslator) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.MissingCruxAssetTranslator);
        }
        return this._cruxAssetTranslator;
    }
    private _getConfigKeyManager = (): IKeyManager => {
        if (!this._configKeyManager) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.ConfigKeyManagerRequired);
        }
        return this._configKeyManager;
    }
    private _getCruxDomainRepository = () => {
        // Handling multiple variants of CruxDomainRepositories
        let cruxDomainRepository: ICruxDomainRepository;
        if (this._cruxDomainRepository.name === BlockstackCruxDomainRepository.name) {
            cruxDomainRepository = new this._cruxDomainRepository({domainContext: this._domainContext});
        } else {
            cruxDomainRepository = new this._cruxDomainRepository();
        }
        return cruxDomainRepository;
    }
    private _getCruxAssetTranslatorRepository = () => {
        // Handling multiple variants of CruxAssetTranslatorRepositories
        let cruxAssetTranslatorRepository: ICruxAssetTranslatorRepository;
        if (this._cruxAssetTranslatorRepository.name === BlockstackCruxAssetTranslatorRepository.name) {
            cruxAssetTranslatorRepository = new this._cruxAssetTranslatorRepository({domainContext: this._getCruxDomain().domain});
        } else if (this._cruxAssetTranslatorRepository.name === ManualCruxAssetTranslatorRepository.name) {
            cruxAssetTranslatorRepository = new this._cruxAssetTranslatorRepository({assetMapping: this._getAssetMappingOverride()});
        } else {
            cruxAssetTranslatorRepository = new this._cruxAssetTranslatorRepository();
        }
        return cruxAssetTranslatorRepository;
    }
    private _getAssetMappingOverride = (): IClientAssetMapping => {
        if (!this._assetMapping) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.AssetMappingRequired);
        }
        return this._assetMapping;
    }
    private _restoreCruxDomain = async (): Promise<void> => {
        this._cruxDomain = await this._getCruxDomainRepository().restore(this._getConfigKeyManager());
    }
    private _restoreCruxAssetTranslator = async (): Promise<void> => {
        const cruxAssetTranslatorRepository = this._getCruxAssetTranslatorRepository();
        this._cruxAssetTranslator = await cruxAssetTranslatorRepository.restore(this._getConfigKeyManager());
    }
}
