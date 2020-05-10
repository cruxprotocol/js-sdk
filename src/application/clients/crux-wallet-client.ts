// Importing packages
import Logger from "js-logger";
import {
    CruxDomain, CruxGateway,
    CruxSpec,
    CruxUser,
    IAddress,
    IAddressMapping,
    IAssetMatcher,
    ICruxUserRegistrationStatus,
    SubdomainRegistrationStatus,
    SubdomainRegistrationStatusDetail,
} from "../../core/entities";
import {
    ICruxBlockstackInfrastructure,
    ICruxDomainRepository, ICruxGatewayRepository,
    ICruxUserRepository, IGatewayIdentityClaim,
    IKeyManager,
    isInstanceOfKeyManager,
} from "../../core/interfaces";
import {
    BasicKeyManager,
    BlockstackCruxDomainRepository,
    BlockstackCruxUserRepository,
    CruxLinkGatewayRepository,
    IBlockstackCruxDomainRepositoryOptions,
    IBlockstackCruxUserRepositoryOptions,
    ICruxGatewayRepositoryRepositoryOptions,
} from "../../infrastructure/implementations";
import {CruxDomainId, CruxId, getLogger, InMemStorage, StorageService} from "../../packages";
import {Encryption} from "../../packages/encryption";
import {CruxClientError, ERROR_STRINGS, ErrorHelper, PackageErrorCode} from "../../packages/error";
import {CruxAssetTranslator, IPutAddressMapFailures, IPutAddressMapSuccess, IResolvedClientAssetMap} from "../services";

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

export interface IPaymentRequestMessage {
    amount: string;
    assetId: string;
}

export const getCruxDomainRepository = (options: IBlockstackCruxDomainRepositoryOptions): ICruxDomainRepository => {
    return new BlockstackCruxDomainRepository(options);
};

export const getCruxUserRepository = (options: IBlockstackCruxUserRepositoryOptions): ICruxUserRepository => {
    return new BlockstackCruxUserRepository(options);
};

export const getCruxGatewayRepository = (options: ICruxGatewayRepositoryRepositoryOptions): ICruxGatewayRepository => {
    return new CruxLinkGatewayRepository(options);
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
    private gatewayRepo?: ICruxGatewayRepository;
    private selfCruxUser?: CruxUser;
    private selfGateway?: CruxGateway;
    private selfIdClaim?: IGatewayIdentityClaim;

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
    public sendPaymentRequest = async (walletSymbol: string, recipientCruxId: string, amount: string): Promise<void> => {
        await this.initPromise;
        const recipientCruxUser = await this.getCruxUserByID(recipientCruxId);
        if (!recipientCruxUser) {
            throw Error("Cannot find recipient user");
        }
        const assetToRequest = this.cruxAssetTranslator.symbolToAssetId(walletSymbol);
        if (!assetToRequest) {
            throw Error("Did not find asset to send");
        }
        const recipientGateway = this.gatewayRepo!.get({selfIdClaim: this.selfIdClaim, receiverId: recipientCruxUser.cruxID});
        await recipientGateway.sendMessage({
            amount,
            assetId: assetToRequest,
        });

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
        const enabledAssetGroups = await this.putEnabledAssetGroups();
        return {success, failures};
    }

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
        if (this.selfCruxUser) {
            return this.selfCruxUser;
        }
        this.selfCruxUser = await this.cruxUserRepository.getWithKey(this.getKeyManager());
        return this.selfCruxUser;
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
        // await this.openCruxGateway();
    }

    private getSelfClaim = async (): Promise<IGatewayIdentityClaim | undefined> => {
        let selfClaim: IGatewayIdentityClaim | undefined;

        if (this.keyManager) {
            const selfUser = await this.getCruxUserByKey();
            if (selfUser) {
                selfClaim = {
                    cruxId: selfUser.cruxID,
                    keyManager: this.keyManager,
                };
            }
        } else {
            selfClaim = undefined;
        }
        return selfClaim;
    }
    private openCruxGateway = async () => {
        this.selfIdClaim = await this.getSelfClaim();
        this.gatewayRepo = getCruxGatewayRepository({
            defaultLinkServer: {
                host: "localhost",
                port: 4005,
            },
        });
        if (this.selfIdClaim) {
            this.selfGateway = this.gatewayRepo.get({selfIdClaim: this.selfIdClaim});
            this.selfGateway.listen((message, metadata) => {
                console.log("CRUX WALLET CLIENT RECD NEW MESSAGE: ", message, metadata);
            });
        }
    }

}
