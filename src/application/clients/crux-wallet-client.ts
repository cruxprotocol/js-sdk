// Importing packages
import { CruxAssetTranslator, IPutAddressMapFailures, IPutAddressMapSuccess, IResolvedClientAssetMap } from "../../application/services/crux-asset-translator";
import { CruxDomain } from "../../core/entities/crux-domain";
import { CruxSpec } from "../../core/entities/crux-spec";
import { CruxUser, IAddress, IAddressMapping, IAssetMatcher, ICruxUserRegistrationStatus, SubdomainRegistrationStatus, SubdomainRegistrationStatusDetail } from "../../core/entities/crux-user";
import { ICruxBlockstackInfrastructure } from "../../core/interfaces";
import {ICruxDomainRepository} from "../../core/interfaces/crux-domain-repository";
import { ICruxUserRepository } from "../../core/interfaces/crux-user-repository";
import { IKeyManager, isInstanceOfKeyManager } from "../../core/interfaces/key-manager";
import { BasicKeyManager } from "../../infrastructure/implementations/basic-key-manager";
import {
    BlockstackCruxDomainRepository,
    IBlockstackCruxDomainRepositoryOptions,
} from "../../infrastructure/implementations/blockstack-crux-domain-repository";
import {
    BlockstackCruxUserRepository,
    IBlockstackCruxUserRepositoryOptions,
} from "../../infrastructure/implementations/blockstack-crux-user-repository";
import { Encryption } from "../../packages/encryption";
import { BaseError, CruxClientError, ErrorHelper, PackageErrorCode } from "../../packages/error";
import { CruxDomainId, CruxId } from "../../packages/identity-utils";
import { InMemStorage } from "../../packages/inmem-storage";
import { StorageService } from "../../packages/storage";

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
    status: ICruxUserRegistrationStatus;
}

export const getCruxDomainRepository = (options: IBlockstackCruxDomainRepositoryOptions): ICruxDomainRepository => {
    return new BlockstackCruxDomainRepository(options);
};

export const getCruxUserRepository = (options: IBlockstackCruxUserRepositoryOptions): ICruxUserRepository => {
    return new BlockstackCruxUserRepository(options);
};
export class CruxWalletClient {
    public e = Encryption;
    public walletClientName: string;
    private cruxBlockstackInfrastructure: ICruxBlockstackInfrastructure;
    private initPromise: Promise<void>;
    private cruxDomainRepo: ICruxDomainRepository;
    private cruxDomainId: CruxDomainId;
    private cruxDomain?: CruxDomain;
    private cruxUserRepository!: ICruxUserRepository;
    private cruxAssetTranslator!: CruxAssetTranslator;
    private keyManager?: IKeyManager;
    private resolvedClientAssetMapping?: IResolvedClientAssetMap;
    private cacheStorage?: StorageService;

    constructor(options: ICruxWalletClientOptions) {
        this.cacheStorage = options.cacheStorage || new InMemStorage();
        this.cruxBlockstackInfrastructure = options.blockstackInfrastructure || CruxSpec.blockstack.infrastructure;
        this.walletClientName = options.walletClientName;
        if (options.privateKey) {
            if (typeof options.privateKey === "string") {
                this.keyManager = new BasicKeyManager(options.privateKey);
            } else if (isInstanceOfKeyManager(options.privateKey)) {
                this.keyManager = options.privateKey;
            } else {
                throw ErrorHelper.getPackageError(null, PackageErrorCode.InvalidPrivateKeyFormat);
            }
        }
        this.cruxDomainRepo = getCruxDomainRepository({cacheStorage: this.cacheStorage, blockstackInfrastructure: this.cruxBlockstackInfrastructure});
        this.cruxDomainId = new CruxDomainId(this.walletClientName);
        this.initPromise = this.asyncInit();
    }

    @throwCruxClientError
    public init = async () => {
        // for backward-compatibility;
        return this.initPromise;
    }

    @throwCruxClientError
    public getCruxIDState = async (): Promise<ICruxIDState> => {
        await this.initPromise;
        const cruxUser = await this.getCruxUserByKey();
        if (!cruxUser) {
            return {
                cruxID: null,
                status: {
                    status: SubdomainRegistrationStatus.NONE,
                    statusDetail: SubdomainRegistrationStatusDetail.NONE,
                },
            };
        } else {
            return {
                cruxID: cruxUser.cruxID.toString(),
                status : cruxUser.info.registrationStatus,
            };
        }
    }

    @throwCruxClientError
    public resolveCurrencyAddressForCruxID = async (fullCruxID: string, walletCurrencySymbol: string): Promise<IAddress> => {
        await this.initPromise;
        const tag = "resolving_address";
        const cruxUser = await this.getCruxUserByID(fullCruxID.toLowerCase(), tag);
        if (!cruxUser) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.UserDoesNotExist);
        }
        const asset = this.cruxAssetTranslator.symbolToAsset(walletCurrencySymbol);
        if (!asset) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.AssetIDNotAvailable);
        }
        const address = await cruxUser.getAddressFromAsset(asset, this.keyManager);
        if (!address) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.AddressNotAvailable);
        }
        return address;
    }

    @throwCruxClientError
    public resolveAssetAddressForCruxID = async (fullCruxID: string, assetMatcher: IAssetMatcher): Promise<IAddress> => {
        await this.initPromise;
        const tag = "resolving_address_with_matcher";
        const cruxUser = await this.getCruxUserByID(fullCruxID.toLowerCase(), tag);
        if (!cruxUser) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.UserDoesNotExist);
        }
        assetMatcher.assetGroup = this.cruxAssetTranslator.symbolAssetGroupToAssetIdAssetGroup(assetMatcher.assetGroup);
        const address =  await cruxUser.getAddressFromAssetMatcher(assetMatcher);
        if (!address) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.AddressNotAvailable);
        }
        return address;
    }

    @throwCruxClientError
    public getAddressMap = async (): Promise<IAddressMapping> => {
        await this.initPromise;
        const cruxUser = await this.cruxUserRepository.getWithKey(this.getKeyManager());
        if (cruxUser) {
            const assetIdAddressMap = cruxUser.getAddressMap();
            return this.cruxAssetTranslator.assetIdAddressMapToSymbolAddressMap(assetIdAddressMap);
        }
        return {};
    }

    @throwCruxClientError
    public putAddressMap = async (newAddressMap: IAddressMapping): Promise<{success: IPutAddressMapSuccess, failures: IPutAddressMapFailures}> => {
        await this.initPromise;
        const cruxUser = await this.getCruxUserByKey();
        if (!cruxUser) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.UserDoesNotExist);
        }
        const {assetAddressMap, success, failures} = this.cruxAssetTranslator.symbolAddressMapToAssetIdAddressMap(newAddressMap);
        cruxUser.setAddressMap(assetAddressMap);
        await this.cruxUserRepository.save(cruxUser, this.getKeyManager());
        return {success, failures};
    }

    public putPrivateAddressMap = async (fullCruxID: string, newAddressMap: IAddressMapping): Promise<{success: IPutAddressMapSuccess, failures: IPutAddressMapFailures}> => {
        await this.initPromise;
        const cruxUserWithKey = await this.getCruxUserByKey();
        const cruxUser = await await this.getCruxUserByID(fullCruxID.toLowerCase());
        if (!cruxUser || !cruxUserWithKey) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.UserDoesNotExist);
        }
        const {assetAddressMap, success, failures} = this.cruxAssetTranslator.symbolAddressMapToAssetIdAddressMap(newAddressMap);
        if (!cruxUser.publicKey) {
            throw new BaseError(null, `not supported with user: ${fullCruxID}`);
        }
        cruxUserWithKey.setPrivateAddressMap(cruxUser.publicKey, assetAddressMap, this.getKeyManager());
        await this.cruxUserRepository.save(cruxUserWithKey, this.getKeyManager());
        return {success, failures};
    }

    @throwCruxClientError
    public getEnabledAssetGroups = async (): Promise<string[]> => {
        await this.initPromise;
        if (!this.keyManager) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.PrivateKeyRequired);
        }
        const cruxUser = await this.getCruxUserByKey();
        if (!cruxUser) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.UserDoesNotExist);
        }
        const enabledAssetGroups = cruxUser.config.enabledAssetGroups.map((assetIdAssetGroup: string) => this.cruxAssetTranslator.assetIdAssetGroupToSymbolAssetGroup(assetIdAssetGroup));
        return enabledAssetGroups;
    }

    /**
     * ```ts
     *  const sampleEnabledAssetGroups: string[] = ["ERC20_eth"];
     *  // assetGroups can be constructed in the format "{assetType}_{parentAssetId}";
     *  const enabledAssetGroups = await cruxClient.putEnabledAssetGroups(sampleEnabledAssetGroups);
     * ```
     */
    @throwCruxClientError
    public putEnabledAssetGroups = async (symbolAssetGroups: string[]): Promise<string[]> => {
        await this.initPromise;
        let cruxUser = await this.getCruxUserByKey();
        if (!cruxUser) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.UserDoesNotExist);
        }
        const assetIdAssetGroups = symbolAssetGroups.map((assetGroup: string) => this.cruxAssetTranslator.symbolAssetGroupToAssetIdAssetGroup(assetGroup));
        cruxUser.setSupportedAssetGroups(assetIdAssetGroups);
        cruxUser = await this.cruxUserRepository.save(cruxUser, this.getKeyManager());
        const enabledAssetGroups = cruxUser.config.enabledAssetGroups.map((assetIdAssetGroup: string) => this.cruxAssetTranslator.assetIdAssetGroupToSymbolAssetGroup(assetIdAssetGroup));
        return enabledAssetGroups;
    }

    @throwCruxClientError
    public isCruxIDAvailable = async (cruxIDSubdomain: string): Promise<boolean> => {
        await this.initPromise;
        return this.cruxUserRepository.isCruxIdAvailable(cruxIDSubdomain);
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
        const cruxUser = await this.getCruxUserByKey();
        if (cruxUser) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.ExistingCruxIDFound, cruxUser.cruxID);
        }
        await this.cruxUserRepository.create(cruxIDSubdomain.toLowerCase(), this.getKeyManager());
    }

    @throwCruxClientError
    public getAssetMap = async (): Promise<IResolvedClientAssetMap> => {
        await this.initPromise;
        if (this.resolvedClientAssetMapping) {
            return this.resolvedClientAssetMapping;
        }
        this.resolvedClientAssetMapping = this.cruxAssetTranslator.assetIdAssetListToSymbolAssetMap(this.getCruxDomain().config.assetList);
        return this.resolvedClientAssetMapping;
    }

    private getCruxUserByID = async (cruxIdString: string, tag?: string): Promise<CruxUser|undefined> => {
        const cruxId = CruxId.fromString(cruxIdString);
        return await this.cruxUserRepository.getByCruxId(cruxId, tag, true);
    }

    private getCruxUserByKey = async (): Promise<CruxUser|undefined> => {
        const cruxUser = await this.cruxUserRepository.getWithKey(this.getKeyManager());
        return cruxUser;
    }

    private getKeyManager = (): IKeyManager => {
        if (!this.keyManager) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.PrivateKeyRequired);
        }
        return this.keyManager;
    }

    private getCruxDomain = () => {
        if (!this.cruxDomain) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.MissingCruxDomainInCruxWalletClient);
        }
        return this.cruxDomain;
    }

    private asyncInit = async (): Promise<void> => {
        this.cruxDomain = await this.cruxDomainRepo.get(this.cruxDomainId);
        if (!this.cruxDomain) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.InvalidWalletClientName);
        }
        this.cruxUserRepository = getCruxUserRepository({cacheStorage: this.cacheStorage, blockstackInfrastructure: this.cruxBlockstackInfrastructure, cruxDomain: this.cruxDomain});
        if (!this.cruxDomain.config) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.CouldNotFindBlockstackConfigurationServiceClientConfig);
        }
        this.cruxAssetTranslator = new CruxAssetTranslator(this.cruxDomain.config.assetMapping, this.cruxDomain.config.assetList);
    }
}
