// Importing packages
import { CruxAssetTranslator, IPutAddressMapFailures, IPutAddressMapSuccess, IResolvedClientAssetMap } from "../core/entities/crux-asset-translator";
import { CruxDomain } from "../core/entities/crux-domain";
import { CruxUser, IAddress, IAddressMapping } from "../core/entities/crux-user";
import { ICruxAssetTranslatorRepository, ICruxAssetTranslatorRepositoryConstructor } from "../core/interfaces/crux-asset-translator-repository";
import { ICruxUserRepository } from "../core/interfaces/crux-user-repository";
import { IKeyManager } from "../core/interfaces/key-manager";
import { ICruxIDState, setCacheStorage } from "../index";
import { BasicKeyManager } from "../infrastructure/implementations/basic-key-manager";
import { BlockstackCruxDomainRepository } from "../infrastructure/implementations/blockstack-crux-domain-repository";
import { BlockstackCruxUserRepository } from "../infrastructure/implementations/blockstack-crux-user-repository";
import {
    errors,
    identityUtils,
    inmemStorage,
    storage,
} from "../packages";
import { BaseError, ErrorHelper, PackageErrorCode } from "../packages/error";
import { CruxDomainId, CruxId } from "../packages/identity-utils";
import { cloneValue } from "../packages/utils";
export interface ICruxClientOptions {
    // getEncryptionKey?: () => string;
    privateKey?: string;
    cacheStorage?: storage.StorageService;
    // encryption?: typeof encryption.Encryption;
    // nameService?: nameService.NameService;
    walletClientName: string;
}

export class CruxWalletClient {
    public walletClientName: string;
    private _initPromise: Promise<void>;
    private _cruxUser?: CruxUser;
    private cruxDomain?: CruxDomain;
    private _cruxUserRepository: ICruxUserRepository;
    private _cruxAssetTranslator?: CruxAssetTranslator;
    private _keyManager?: IKeyManager;
    private resolvedClientAssetMapping?: IResolvedClientAssetMap;

    constructor(options: ICruxClientOptions) {
        setCacheStorage(options.cacheStorage || new inmemStorage.InMemStorage());
        this.walletClientName = options.walletClientName;
        this._cruxUserRepository = new BlockstackCruxUserRepository();
        this._initPromise = this._init(options);
    }

    public getCruxIDState = async (): Promise<ICruxIDState> => {
        await this._initPromise;
        try {
            if (!this._cruxUser) {
                if (this._keyManager) {
                    return {
                        cruxID: null,
                        status: {
                            status: "NONE",
                            statusDetail: "",
                        },
                    };
                } else {
                    throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.PrivateKeyRequired);
                }
            }
            return {
                cruxID: this._cruxUser.cruxID.toString(),
                status : this._cruxUser.registrationStatus,
            };
        } catch (err) {
            throw errors.CruxClientError.fromError(err);
        }
    }

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

    public putAddressMap = async (newAddressMap: IAddressMapping): Promise<{success: IPutAddressMapSuccess, failures: IPutAddressMapFailures}> => {
        await this._initPromise;
        try {
            if (!this._keyManager) {
                throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.PrivateKeyRequired);
            }
            const {assetAddressMap, success, failures} = this._getCruxAssetTranslator().symbolAddressMapToAssetIdAddressMap(newAddressMap);
            if (!this._cruxUser) {
                throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.UserDoesNotExist);
            }
            const cruxUser = cloneValue(this._cruxUser);
            cruxUser.addressMap = assetAddressMap;
            this._cruxUser = await this._cruxUserRepository.save(cruxUser, this._keyManager);
            return {success, failures};
        } catch (err) {
            throw errors.CruxClientError.fromError(err);
        }
    }

    public isCruxIDAvailable = async (cruxIDSubdomain: string): Promise<boolean> => {
        await this._initPromise;
        try {
            const cruxIdInput: identityUtils.InputIDComponents = {
                domain: this.walletClientName,
                subdomain: cruxIDSubdomain,
            };
            const cruxId = new CruxId(cruxIdInput);
            return await this._cruxUserRepository.find(cruxId);
        } catch (error) {
            throw errors.CruxClientError.fromError(error);
        }
    }

    public registerCruxID = async (cruxIDSubdomain: string): Promise<void> => {
        await this._initPromise;
        try {
            if (!this._keyManager) {
                throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.PrivateKeyRequired);
            }
            if (this._cruxUser) {
                throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.ExistingCruxIDFound, this._cruxUser.cruxID);
            }
            const cruxIdInput: identityUtils.InputIDComponents = {
                domain: this.walletClientName,
                subdomain: cruxIDSubdomain,
            };
            const cruxId = new CruxId(cruxIdInput);
            this._cruxUser = await this._cruxUserRepository.create(cruxId, this._keyManager);
        } catch (error) {
            throw errors.CruxClientError.fromError(error);
        }
    }

    public getAssetMap = async (): Promise<IResolvedClientAssetMap> => {
        await this._initPromise;
        if (this.resolvedClientAssetMapping) {
            return this.resolvedClientAssetMapping;
        }
        return this._getCruxAssetTranslator().assetIdAssetMapToSymbolAssetMap(this.getCruxDomain().config.assetList);
    }

    private _getCruxUserByID = async (cruxIdString: string): Promise<CruxUser|undefined> => {
        const cruxId = CruxId.fromString(cruxIdString);
        return await this._cruxUserRepository.getByCruxId(cruxId);
    }

    private _getCruxAssetTranslator = () => {
        if (!this._cruxAssetTranslator) {
            throw new BaseError(null, "");
        }
        return this._cruxAssetTranslator;
    }

    private getCruxDomain = () => {
        if (!this.cruxDomain) {
            throw new BaseError(null, "");
        }
        return this.cruxDomain;
    }

    private _init = async (options: ICruxClientOptions): Promise<void> => {
        this.cruxDomain = await new BlockstackCruxDomainRepository().get(new CruxDomainId(this.walletClientName));
        if (!this.cruxDomain) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.CouldNotFindBlockstackConfigurationServiceClientConfig);
        }
        if (options.privateKey) {
            this._keyManager = new BasicKeyManager(options.privateKey);
            this._cruxUser = await this._cruxUserRepository.getWithKey(this._keyManager, new CruxDomainId(this.walletClientName));
        }
        this._cruxAssetTranslator = await new CruxAssetTranslator(this.cruxDomain.config.assetMapping);
    }
}
