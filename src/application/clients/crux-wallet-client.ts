// Importing packages
import Logger from "js-logger";
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
import { CruxClientError, ERROR_STRINGS, ErrorHelper, PackageErrorCode } from "../../packages/error";
import { CruxDomainId, CruxId } from "../../packages/identity-utils";
import { InMemStorage } from "../../packages/inmem-storage";
import { getLogger } from "../../packages/logger";
import { StorageService } from "../../packages/storage";

const cruxWalletClientDebugLoggerName = "CruxWalletClient:DEBUGGING";

export interface IPutPrivateAddressMapResult {
    failures: IGenericFailures[];
}

export interface IGenericFailures {
    errorEntity: string;
    errorCode: number;
    errorMessage: string;
}

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
                        const log = getLogger(cruxWalletClientDebugLoggerName);
                        log.error(error);
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
    debugLogging?: boolean;
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
        getLogger(cruxWalletClientDebugLoggerName).setLevel(options.debugLogging ? Logger.DEBUG : Logger.OFF);
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

    /**
     * ```ts
     *  const cruxIDState: ICruxIDState = await cruxClient.getCruxIDState();
     * ```
     */
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

    /**
     * ```ts
     *  const sampleCruxID = "alice@cruxdev.crux";
     *  const sampleWalletCurrencySymbol = "eth"
     *  const resolvedAddress: IAddress = await cruxClient.resolveCurrencyAddressForCruxID(sampleCruxID, sampleWalletCurrencySymbol);
     * ```
     */
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

    /**
     * ```ts
     *  const sampleCruxID = "alice@cruxdev.crux";
     *  const sampleAssetMatcher: IAssetMatcher = {assetGroup: "ERC20_eth"}; // with optional assetIdentifierValue which could be the contract address or property id of the asset
     *  // assetGroups can be constructed in the format "{assetType}_{parentAssetId}";
     *  const resolvedAddress: IAddress = await cruxClient.resolveAssetAddressForCruxID(sampleCruxID, sampleAssetMatcher);
     * ```
     */
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

    /**
     * ```ts
     *  const myAddressMap: IAddressMapping = await cruxClient.getAddressMap();
     * ```
     */
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
     *  const putPublicAddressResult: {success: IPutAddressMapSuccess, failures: IPutAddressMapFailures} = await cruxClient.putAddressMap(sampleAddressMap);
     * ```
     */
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
        const enabledAssetGroups = await this.putEnabledAssetGroups();
        return {success, failures};
    }

    /**
     * ```ts
     *  const sampleCruxIDs = ["alice@cruxdev.crux", "bob123@cruxdev.crux"];
     *  const sampleAddressMap: IAddressMapping = {
     *  'BTC': {
     *      addressHash: '1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX'
     *  },
     *  const putPrivateAddressResult: IPutPrivateAddressMapResult = await cruxClient.putPrivateAddressMap(sampleCruxIDs, sampleAddressMap);
     * ```
     */
    public putPrivateAddressMap = async (fullCruxIDs: string[], newAddressMap: IAddressMapping): Promise<IPutPrivateAddressMapResult> => {
        await this.initPromise;
        const cruxUserWithKey = await this.getCruxUserByKey();
        if (!cruxUserWithKey) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.UserDoesNotExist);
        }
        const putFailures: IGenericFailures[] = [];
        const {assetAddressMap, success, failures} = this.cruxAssetTranslator.symbolAddressMapToAssetIdAddressMap(newAddressMap);
        for (const currency of Object.keys(failures)) {
            const currencyFailure: IGenericFailures = {
                errorCode: PackageErrorCode.CurrencyDoesNotExistInClientMapping,
                errorEntity: currency,
                errorMessage: ERROR_STRINGS[PackageErrorCode.CurrencyDoesNotExistInClientMapping],
            };
            putFailures.push(currencyFailure);
        }
        for (const fullCruxID of fullCruxIDs) {
            const cruxUser = await this.getCruxUserByID(fullCruxID.toLowerCase());
            if (!cruxUser) {
                // throw ErrorHelper.getPackageError(null, PackageErrorCode.UserDoesNotExist);
                const userFailure: IGenericFailures = {
                    errorCode: PackageErrorCode.UserDoesNotExist,
                    errorEntity: fullCruxID,
                    errorMessage: ERROR_STRINGS[PackageErrorCode.UserDoesNotExist],
                };
                putFailures.push(userFailure);
            } else {
                cruxUserWithKey.setPrivateAddressMap(cruxUser, assetAddressMap, this.getKeyManager());
            }
        }
        await this.cruxUserRepository.save(cruxUserWithKey, this.getKeyManager());
        return {failures: putFailures};
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

    @throwCruxClientError
    public putEnabledAssetGroups = async (): Promise<string[]> => {
        await this.initPromise;
        let cruxUser = await this.getCruxUserByKey();
        if (!cruxUser) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.UserDoesNotExist);
        }
        cruxUser.setSupportedAssetGroups();
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

    /**
     * ```ts
     *  const assetMap: IResolvedClientAssetMap = await cruxClient.getAssetMap();
     * ```
     */
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
