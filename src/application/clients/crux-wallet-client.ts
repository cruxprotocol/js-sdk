// Importing packages
import { CruxAssetTranslator, IPutAddressMapFailures, IPutAddressMapSuccess, IResolvedClientAssetMap } from "../../application/services/crux-asset-translator";
import { CruxDomain } from "../../core/entities/crux-domain";
import { CruxSpec } from "../../core/entities/crux-spec";
import { CruxUser, IAddress, IAddressMapping, ICruxUserRegistrationStatus } from "../../core/entities/crux-user";
import { ICruxBlockstackInfrastructure } from "../../core/interfaces";
import {ICruxDomainRepository} from "../../core/interfaces/crux-domain-repository";
import { ICruxUserRepository } from "../../core/interfaces/crux-user-repository";
import { IKeyManager } from "../../core/interfaces/key-manager";
import { BasicKeyManager } from "../../infrastructure/implementations/basic-key-manager";
import {
    BlockstackCruxDomainRepository,
    IBlockstackCruxDomainRepositoryOptions,
} from "../../infrastructure/implementations/blockstack-crux-domain-repository";
import {
    BlockstackCruxUserRepository,
    IBlockstackCruxUserRepositoryOptions,
} from "../../infrastructure/implementations/blockstack-crux-user-repository";
import { CruxClientError, ErrorHelper, PackageErrorCode } from "../../packages/error";
import { CruxDomainId, CruxId, InputIDComponents } from "../../packages/identity-utils";
import { InMemStorage } from "../../packages/inmem-storage";
import { StorageService } from "../../packages/storage";
import { cloneValue } from "../../packages/utils";

export const throwCruxClientError = (target: any, prop: any, descriptor?: { value?: any; }): any => {
    let fn: any;
    let patchedFn: any;
    if (descriptor) {
        fn = descriptor.value;
    }
    return {
        configurable: true,
        enumerable: true,
        get() {
            if (!patchedFn) {
                patchedFn = async (...params: any[]) => {
                    try {
                        return await fn.call(this, ...params);
                    } catch (error) {
                        throw CruxClientError.fromError(error);
                    }
                };
            }
            return patchedFn;
        },
        set(newFn: any) {
            patchedFn = undefined;
            fn = newFn;
        },
    };
};
export interface ICruxWalletClientOptions {
    privateKey?: string | IKeyManager;
    blockstackInfrastructure?: ICruxBlockstackInfrastructure;
    cacheStorage?: StorageService;
    walletClientName: string;
}

export interface ICruxIDState {
    cruxID: string | null;
    status?: ICruxUserRegistrationStatus;
}

export const getCruxDomainRepository = (options: IBlockstackCruxDomainRepositoryOptions): ICruxDomainRepository => {
    return new BlockstackCruxDomainRepository(options);
};

export const getCruxUserRepository = (options: IBlockstackCruxUserRepositoryOptions): ICruxUserRepository => {
    return new BlockstackCruxUserRepository(options);
};
export class CruxWalletClient {
    public walletClientName: string;
    private cruxBlockstackInfrastructure: ICruxBlockstackInfrastructure;
    private initPromise: Promise<void>;
    private cruxUser?: CruxUser;
    private cruxDomain?: CruxDomain;
    private cruxUserRepository!: ICruxUserRepository;
    private cruxAssetTranslator?: CruxAssetTranslator;
    private keyManager?: IKeyManager;
    private resolvedClientAssetMapping?: IResolvedClientAssetMap;
    private cacheStorage?: StorageService;

    constructor(options: ICruxWalletClientOptions) {
        this.cacheStorage = options.cacheStorage || new InMemStorage();
        this.cruxBlockstackInfrastructure = options.blockstackInfrastructure || CruxSpec.blockstack.infrastructure;
        this.walletClientName = options.walletClientName;
        if (options.privateKey) {
            this.keyManager = typeof options.privateKey === "string" ? new BasicKeyManager(options.privateKey) : options.privateKey;
        }
        this.initPromise = this.init(options);
    }

    @throwCruxClientError
    public getCruxIDState = async (): Promise<ICruxIDState> => {
        await this.initPromise;
        if (!this.cruxUser) {
            if (this.keyManager) {
                return {
                    cruxID: null,
                };
            } else {
                throw ErrorHelper.getPackageError(null, PackageErrorCode.PrivateKeyRequired);
            }
        } else {
            this.cruxUser = await this.cruxUserRepository.getByCruxId(this.cruxUser.cruxID);
            return {
                cruxID: this.cruxUser!.cruxID.toString(),
                status : this.cruxUser!.registrationStatus,
            };
        }
    }

    @throwCruxClientError
    public resolveCurrencyAddressForCruxID = async (fullCruxID: string, walletCurrencySymbol: string): Promise<IAddress> => {
        await this.initPromise;
        const tag = "resolving_address";
        const cruxUser = await this.getCruxUserByID(fullCruxID, tag);
        if (!cruxUser) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.UserDoesNotExist);
        }
        // TODO ERC20MODE #2: If walletCurrencySymbol then same. if assetFilter, access another method of assetTranslator called assetFilterToAssetId
        const assetId = this.getCruxAssetTranslator().symbolToAssetId(walletCurrencySymbol);
        if (!assetId) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.AssetIDNotAvailable);
        }
        const address =  cruxUser.getAddressFromAsset(assetId);
        if (!address) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.AddressNotAvailable);
        }
        return address;
    }

    @throwCruxClientError
    public getAddressMap = async (): Promise<IAddressMapping> => {
        await this.initPromise;
        if (!this.keyManager) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.PrivateKeyRequired);
        }
        if (this.cruxUser) {
            const assetIdAddressMap = this.cruxUser.getAddressMap();
            return this.getCruxAssetTranslator().assetIdAddressMapToSymbolAddressMap(assetIdAddressMap);
        }
        return {};
    }

    @throwCruxClientError
    public putAddressMap = async (newAddressMap: IAddressMapping): Promise<{success: IPutAddressMapSuccess, failures: IPutAddressMapFailures}> => {
        await this.initPromise;
        if (!this.keyManager) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.PrivateKeyRequired);
        }
        const {assetAddressMap, success, failures} = this.getCruxAssetTranslator().symbolAddressMapToAssetIdAddressMap(newAddressMap);
        if (!this.cruxUser) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.UserDoesNotExist);
        }
        const cruxUser = cloneValue(this.cruxUser);
        cruxUser.addressMap = assetAddressMap;
        this.cruxUser = await this.cruxUserRepository.save(cruxUser, this.keyManager);
        return {success, failures};
    }

    @throwCruxClientError
    public isCruxIDAvailable = async (cruxIDSubdomain: string): Promise<boolean> => {
        await this.initPromise;
        const cruxIdInput: InputIDComponents = {
            domain: this.walletClientName,
            subdomain: cruxIDSubdomain,
        };
        const cruxId = new CruxId(cruxIdInput);
        return this.cruxUserRepository.isCruxIdAvailable(cruxId);
    }

    /**
     * ```ts
     *  const sampleAddressMap: IAddressMapping = {
     *      'BTC': {
     *          addressHash: '1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX'
     *      },
     *      'ETH': {
     *          addressHash: '0x7cB57B5A97eAbe94205C07890BE4c1aD31E486A8'
     *      },
     *  }
     *  // Advised to pipe the method putAddressMap to registerCruxID call
     *  await cruxClient.registerCruxID("bob")
     *      .then(() => {
     *          return cruxClient.putAddressMap(sampleAddressMap)
     *              .catch((addressUpdationError) => {
     *                  // Handling addressUpdation error
     *              })
     *      })
     *      .catch((registrationError) => {
     *          // Handling registration error
     *      })
     * ```
     */
    @throwCruxClientError
    public registerCruxID = async (cruxIDSubdomain: string): Promise<void> => {
        await this.initPromise;
        if (!this.keyManager) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.PrivateKeyRequired);
        }
        if (this.cruxUser) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.ExistingCruxIDFound, this.cruxUser.cruxID);
        }
        const cruxIdInput: InputIDComponents = {
            domain: this.walletClientName,
            subdomain: cruxIDSubdomain,
        };
        const cruxId = new CruxId(cruxIdInput);
        this.cruxUser = await this.cruxUserRepository.create(cruxId, this.keyManager);
    }

    @throwCruxClientError
    public getAssetMap = async (): Promise<IResolvedClientAssetMap> => {
        await this.initPromise;
        if (this.resolvedClientAssetMapping) {
            return this.resolvedClientAssetMapping;
        }
        this.resolvedClientAssetMapping = this.getCruxAssetTranslator().assetIdAssetListToSymbolAssetMap(this.getCruxDomain().config.assetList);
        return this.resolvedClientAssetMapping;
    }

    private getCruxUserByID = async (cruxIdString: string, tag?: string): Promise<CruxUser|undefined> => {
        const cruxId = CruxId.fromString(cruxIdString);
        return await this.cruxUserRepository.getByCruxId(cruxId, tag);
    }

    private getCruxAssetTranslator = () => {
        if (!this.cruxAssetTranslator) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.MissingCruxAssetTranslator);
        }
        return this.cruxAssetTranslator;
    }

    private getCruxDomain = () => {
        if (!this.cruxDomain) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.MissingCruxDomainInCruxWalletClient);
        }
        return this.cruxDomain;
    }

    private init = async (options: ICruxWalletClientOptions): Promise<void> => {
        const cruxDomainId = new CruxDomainId(this.walletClientName);
        const cruxDomainRepo: ICruxDomainRepository = getCruxDomainRepository({cacheStorage: this.cacheStorage, blockstackInfrastructure: this.cruxBlockstackInfrastructure});
        this.cruxDomain = await cruxDomainRepo.get(cruxDomainId);
        if (!this.cruxDomain) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.InvalidWalletClientName);
        }
        this.cruxUserRepository = getCruxUserRepository({cacheStorage: this.cacheStorage, blockstackInfrastructure: this.cruxBlockstackInfrastructure, cruxDomain: this.cruxDomain});
        if (!this.cruxDomain.config) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.CouldNotFindBlockstackConfigurationServiceClientConfig);
        }
        if (this.keyManager) {
            this.cruxUser = await this.cruxUserRepository.getWithKey(this.keyManager, cruxDomainId);
        }
        this.cruxAssetTranslator = await new CruxAssetTranslator(this.cruxDomain.config.assetMapping);
    }
}
