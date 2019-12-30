// Importing packages
import { CruxAssetTranslator } from "../core/entities/crux-asset-translator";
import { CruxUser } from "../core/entities/crux-user";
import { ICruxAssetTranslatorRepository, ICruxAssetTranslatorRepositoryConstructor } from "../core/interfaces/crux-asset-translator-repository";
import { ICruxUserRepository } from "../core/interfaces/crux-user-repository";
import { BlockstackCruxAssetTranslatorRepository } from "../infrastructure/implementations/blockstack-crux-asset-translator-repository";
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
import { ErrorHelper, PackageErrorCode } from "../packages/error";
export interface ICruxClientOptions {
    getEncryptionKey?: () => string;
    privateKey?: string;
    cacheStorage?: storage.StorageService;
    encryption?: typeof encryption.Encryption;
    nameService?: nameService.NameService;
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

    // private _initPromise: Promise<void>;
    private _cruxUser?: CruxUser;
    private _cruxUserRepository: ICruxUserRepository;
    private _cruxAssetTranslator?: CruxAssetTranslator;
    private _cruxAssetTranslatorRepository: ICruxAssetTranslatorRepositoryConstructor;

    constructor(options: ICruxClientOptions) {
        // this._initPromise = this._init();
        this._cruxAssetTranslatorRepository = BlockstackCruxAssetTranslatorRepository;
        this.walletClientName = options.walletClientName;
        const cruxUserRepositoryOptions =  {
            walletClientName: this.walletClientName,
        };
        this._cruxUserRepository = new BlockstackCruxUserRepository(cruxUserRepositoryOptions);
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

    // public resolveCurrencyAddressForCruxID = async (fullCruxID: string, walletCurrencySymbol: string): Promise<IAddress> => {
    //     await this.initPromise;
    //     try {
    //             if (!(this._configService && this._nameService)) {
    //                 throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.ClientNotInitialized);
    //             }
    //             walletCurrencySymbol = walletCurrencySymbol.toLowerCase();
    //             let correspondingAssetId: string = "";
    //             const tag = "resolving_address";
    //             correspondingAssetId = await this._translateSymbolToAssetId(walletCurrencySymbol);
    //             if (!correspondingAssetId) {
    //                 throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.AssetIDNotAvailable);
    //             }

    //             const addressMap = await this._nameService.getAddressMapping(fullCruxID, tag);
    //             log.debug(`Address map: `, addressMap);
    //             if (!addressMap[correspondingAssetId]) {
    //                 throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.AddressNotAvailable);
    //             }
    //             const address: IAddress = addressMap[correspondingAssetId] || addressMap[correspondingAssetId.toLowerCase()];
    //             log.debug(`Address:`, address);
    //             return address;
    //         } catch (err) {
    //             throw errors.CruxClientError.fromError(err);
    //         }
    // }

    public resolveCurrencyAddressForCruxID = async (fullCruxID: string, walletCurrencySymbol: string): Promise<IAddress> => {
        // await this._initPromise;
        walletCurrencySymbol = walletCurrencySymbol.toLowerCase();
        const assetMap = (await this._getCruxAssetTranslatorRepository().get())?.assetMapping;
        if (!assetMap) {
            throw new Error("err");
        }
        const assetId = assetMap[walletCurrencySymbol];

    }

    private _getCruxAssetTranslatorRepository = () => {
        let cruxAssetTranslatorRepository: ICruxAssetTranslatorRepository;
        cruxAssetTranslatorRepository = new this._cruxAssetTranslatorRepository({domainContext: this.walletClientName});
        return cruxAssetTranslatorRepository;
    }

    private _getCruxUser = (): CruxUser => {
        if (this._cruxUser) {
            return this._cruxUser;
        } else if ()
    }

    // private _init = async (): Promise<void> => {
    //     await this._restoreCruxDomain();
    //     await this._restoreCruxAssetTranslator();
    // }

    // private _restoreCruxDomain = async (): Promise<void> => {
    //     this._cruxDomain = await this._getCruxDomainRepository().restore(this._getConfigKeyManager());
    // }
    // private _restoreCruxAssetTranslator = async (): Promise<void> => {
    //     const cruxAssetTranslatorRepository = this._getCruxAssetTranslatorRepository();
    //     this._cruxAssetTranslator = await cruxAssetTranslatorRepository.restore(this._getConfigKeyManager());
    // }
}
