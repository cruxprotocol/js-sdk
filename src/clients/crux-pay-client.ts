// Importing packages
import { CruxAssetTranslator } from "../core/entities/crux-asset-translator";
import { CruxUser, IAddress, IAddressMapping } from "../core/entities/crux-user";
import { ICruxAssetTranslatorRepository, ICruxAssetTranslatorRepositoryConstructor } from "../core/interfaces/crux-asset-translator-repository";
import { ICruxUserRepository } from "../core/interfaces/crux-user-repository";
import { IKeyManager } from "../core/interfaces/key-manager";
import { setCacheStorage } from "../index";
import { BasicKeyManager } from "../infrastructure/implementations/basic-key-manager";
import { BlockstackCruxAssetTranslatorRepository } from "../infrastructure/implementations/blockstack-crux-asset-translator-repository";
import { BlockstackCruxDomainRepository } from "../infrastructure/implementations/blockstack-crux-domain-repository";
import { BlockstackCruxUserRepository } from "../infrastructure/implementations/blockstack-crux-user-repository";
import {
    blockstackService,
    configurationService,
    encryption,
    errors,
    identityUtils,
    inmemStorage,
    nameService,
    storage,
    utils,
} from "../packages";
import { BaseError, ErrorHelper, PackageErrorCode } from "../packages/error";
import { CruxDomainId, CruxId } from "../packages/identity-utils";
export interface ICruxClientOptions {
    // getEncryptionKey?: () => string;
    privateKey?: string;
    cacheStorage?: storage.StorageService;
    // encryption?: typeof encryption.Encryption;
    // nameService?: nameService.NameService;
    walletClientName: string;
}

export class CruxPayClient {
    public walletClientName: string;
    // protected _options: ICruxClientOptions;
    // protected _getEncryptionKey: () => string;
    // protected _keyPair?: blockstackService.IBitcoinKeyPair;
    // protected _encryption: typeof encryption.Encryption;
    // protected _nameService?: nameService.NameService;
    // protected _payIDClaim?: PayIDClaim;
    // protected _configService?: configurationService.ConfigurationService;
    // private _authenticated: boolean;
    // private initPromise: Promise<void>;

    private _initPromise: Promise<void>;
    private _cruxUser?: CruxUser;
    private _cruxUserRepository: ICruxUserRepository;
    private _cruxAssetTranslator?: CruxAssetTranslator;
    private _keyManager?: IKeyManager;

    constructor(options: ICruxClientOptions) {
        setCacheStorage(options.cacheStorage || new inmemStorage.InMemStorage());
        this.walletClientName = options.walletClientName;
        // this._cruxAssetTranslator = new CruxAssetTranslator(cruxDomai);
        const cruxUserRepositoryOptions =  {
            walletClientName: this.walletClientName,
        };
        this._cruxUserRepository = new BlockstackCruxUserRepository(cruxUserRepositoryOptions);
        this._initPromise = this._init(options);
    }

    // constructor(options: ICruxClientOptions) {
    //     this._options = Object.assign({}, options);
    //     // TODO: Need to validate options

    //     if (this._options.getEncryptionKey) {
    //         this._getEncryptionKey = this._options.getEncryptionKey;
    //     } else {
    //         const encryptionKeyConst = utils.getRandomHexString();
    //         this._getEncryptionKey = (): string => encryptionKeyConst;
    //     }
    //     // log.debug(`Encryption key:`, this._getEncryptionKey())

    //     // Setting up the default modules as fallbacks
    //     if (this._options.privateKey) {
    //         this._keyPair =  utils.getKeyPairFromPrivKey(this._options.privateKey);
    //         this._authenticated = true;
    //     } else {
    //         this._authenticated = false;
    //     }

    //     this._encryption = this._options.encryption || encryption.Encryption;
    //     this._nameService = this._options.nameService;
    //     this.walletClientName = this._options.walletClientName;

    //     // Assigning cacheStorage
    //     cacheStorage = this._options.cacheStorage || new inmemStorage.InMemStorage();

    //     log.info(`Config mode:`, config.CONFIG_MODE);
    //     log.info(`CruxPayClient: constructor called`);
    //     this.initPromise = this._init();
    // }

    public resolveCurrencyAddressForCruxID = async (fullCruxID: string, walletCurrencySymbol: string): Promise<IAddress> => {
        await this._initPromise;
        try {
            const cruxUser = await this._getCruxUserByID(fullCruxID);
            if (!cruxUser) {
                throw ErrorHelper.getPackageError(null, PackageErrorCode.UserDoesNotExist);
            }
            const assetId = this._getCruxAssetTranslator().symbolToAssetId(walletCurrencySymbol);
            if (!assetId) {
                throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.AssetIDNotAvailable);
            }
            const address =  cruxUser.getAddress(assetId);
            if (!address) {
                throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.AddressNotAvailable);
            }
            return address;
        } catch (error) {
            throw errors.CruxClientError.fromError(error);
        }
    }

    public getAddressMap = async (): Promise<IAddressMapping> => {
        await this._initPromise;
        try {
            if (!this._keyManager) {
                throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.PrivateKeyRequired);
            }
            if (this._cruxUser) {
                const assetIdAddressMap = this._cruxUser.addressMap;
                return this._getCruxAssetTranslator().assetIdAddressMapToSymbolAddressMap(assetIdAddressMap);
            }
            return {};
        } catch (err) {
            if (err.errorCode && err.errorCode === errors.PackageErrorCode.GaiaEmptyResponse) {
                return {};
            }
            throw errors.CruxClientError.fromError(err);
        }
    }

    private _getCruxUserByID = async (cruxIdString: string): Promise<CruxUser|undefined> => {
        const cruxId = CruxId.fromString(cruxIdString);
        return await this._cruxUserRepository.getByCruxId(cruxId);
    }

    // private _getCruxUser = (): CruxUser => {
    //     if (this._cruxUser) {
    //         return this._cruxUser;
    //     } else if ()
    // }

    private _getCruxAssetTranslator = () => {
        if (!this._cruxAssetTranslator) {
            throw new BaseError(null, "");
        }
        return this._cruxAssetTranslator;
    }

    private _getCruxUserByKeyManager = async (keyManger: IKeyManager): Promise<CruxUser|undefined> => {
        return await this._cruxUserRepository.getWithKey(keyManger);
    }

    private _init = async (options: ICruxClientOptions): Promise<void> => {
        const cruxDomain = await new BlockstackCruxDomainRepository().get(new CruxDomainId(this.walletClientName));
        if (!cruxDomain) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.CouldNotFindBlockstackConfigurationServiceClientConfig);
        }
        if (options.privateKey) {
            this._keyManager = new BasicKeyManager(options.privateKey);
            this._cruxUser = await this._getCruxUserByKeyManager(this._keyManager);
        }
        this._cruxAssetTranslator = await new CruxAssetTranslator(cruxDomain.config.assetMapping);
    }

    // private _restoreCruxDomain = async (): Promise<void> => {
    //     this._cruxDomain = await this._getCruxDomainRepository().restore(this._getConfigKeyManager());
    // }
    // private _restoreCruxAssetTranslator = async (): Promise<void> => {
    //     const cruxAssetTranslatorRepository = this._getCruxAssetTranslatorRepository();
    //     this._cruxAssetTranslator = await cruxAssetTranslatorRepository.restore(this._getConfigKeyManager());
    // }
}
