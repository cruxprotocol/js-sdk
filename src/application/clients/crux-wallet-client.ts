// Importing packages
import { CruxAssetTranslator, IPutAddressMapFailures, IPutAddressMapSuccess, IResolvedClientAssetMap } from "../../application/services/crux-asset-translator";
import { CruxDomain } from "../../core/entities/crux-domain";
import { CruxSpec } from "../../core/entities/crux-spec";
import { CruxUser, IAddress, IAddressMapping } from "../../core/entities/crux-user";
import { ICruxBlockstackInfrastructure } from "../../core/interfaces";
import { ICruxUserRepository } from "../../core/interfaces/crux-user-repository";
import { IKeyManager } from "../../core/interfaces/key-manager";
import { ICruxIDState, setCacheStorage } from "../../index";
import { BasicKeyManager } from "../../infrastructure/implementations/basic-key-manager";
import { BlockstackCruxDomainRepository } from "../../infrastructure/implementations/blockstack-crux-domain-repository";
import { BlockstackCruxUserRepository } from "../../infrastructure/implementations/blockstack-crux-user-repository";
import { BaseError, CruxClientError, ErrorHelper, PackageErrorCode } from "../../packages/error";
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

export class CruxWalletClient {
    public walletClientName: string;
    private cruxBlockstackInfrastructure: ICruxBlockstackInfrastructure;
    private _initPromise: Promise<void>;
    private _cruxUser?: CruxUser;
    private cruxDomain?: CruxDomain;
    private _cruxUserRepository: ICruxUserRepository;
    private _cruxAssetTranslator?: CruxAssetTranslator;
    private _keyManager?: IKeyManager;
    private resolvedClientAssetMapping?: IResolvedClientAssetMap;
    private cacheStorage?: StorageService;

    constructor(options: ICruxWalletClientOptions) {
        this.cacheStorage = options.cacheStorage || new InMemStorage();
        this.cruxBlockstackInfrastructure = options.blockstackInfrastructure || CruxSpec.blockstack.infrastructure;
        this.walletClientName = options.walletClientName;
        if (options.privateKey) {
            this._keyManager = typeof options.privateKey === "string" ? new BasicKeyManager(options.privateKey) : options.privateKey;
        }
        this._cruxUserRepository = new BlockstackCruxUserRepository({cacheStorage: this.cacheStorage, blockstackInfrastructure: this.cruxBlockstackInfrastructure});
        this._initPromise = this._init(options);
    }

    @throwCruxClientError
    public getCruxIDState = async (): Promise<ICruxIDState> => {
        await this._initPromise;
        if (this._keyManager) {
            this._cruxUser = await this._cruxUserRepository.getWithKey(this._keyManager, new CruxDomainId(this.walletClientName));
            if (!this._cruxUser) {
                return {
                    cruxID: null,
                    status: {
                        status: "NONE",
                        statusDetail: "",
                    },
                };
            }
            return {
                cruxID: this._cruxUser.cruxID.toString(),
                status : this._cruxUser.registrationStatus,
            };
        } else {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.PrivateKeyRequired);
        }
    }

    @throwCruxClientError
    public resolveCurrencyAddressForCruxID = async (fullCruxID: string, walletCurrencySymbol: string): Promise<IAddress> => {
        await this._initPromise;
        const tag = "resolving_address";
        const cruxUser = await this._getCruxUserByID(fullCruxID, tag);
        if (!cruxUser) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.UserDoesNotExist);
        }
        const assetId = this._getCruxAssetTranslator().symbolToAssetId(walletCurrencySymbol);
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
        await this._initPromise;
        if (!this._keyManager) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.PrivateKeyRequired);
        }
        if (this._cruxUser) {
            const assetIdAddressMap = this._cruxUser.getAddressMap();
            return this._getCruxAssetTranslator().assetIdAddressMapToSymbolAddressMap(assetIdAddressMap);
        }
        return {};
    }

    @throwCruxClientError
    public putAddressMap = async (newAddressMap: IAddressMapping): Promise<{success: IPutAddressMapSuccess, failures: IPutAddressMapFailures}> => {
        await this._initPromise;
        if (!this._keyManager) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.PrivateKeyRequired);
        }
        const {assetAddressMap, success, failures} = this._getCruxAssetTranslator().symbolAddressMapToAssetIdAddressMap(newAddressMap);
        if (!this._cruxUser) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.UserDoesNotExist);
        }
        const cruxUser = cloneValue(this._cruxUser);
        cruxUser.addressMap = assetAddressMap;
        this._cruxUser = await this._cruxUserRepository.save(cruxUser, this._keyManager);
        return {success, failures};
    }

    @throwCruxClientError
    public isCruxIDAvailable = async (cruxIDSubdomain: string): Promise<boolean> => {
        await this._initPromise;
        const cruxIdInput: InputIDComponents = {
            domain: this.walletClientName,
            subdomain: cruxIDSubdomain,
        };
        const cruxId = new CruxId(cruxIdInput);
        return this._cruxUserRepository.find(cruxId);
    }

    @throwCruxClientError
    public registerCruxID = async (cruxIDSubdomain: string): Promise<void> => {
        await this._initPromise;
        if (!this._keyManager) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.PrivateKeyRequired);
        }
        if (this._cruxUser) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.ExistingCruxIDFound, this._cruxUser.cruxID);
        }
        const cruxIdInput: InputIDComponents = {
            domain: this.walletClientName,
            subdomain: cruxIDSubdomain,
        };
        const cruxId = new CruxId(cruxIdInput);
        this._cruxUser = await this._cruxUserRepository.create(cruxId, this._keyManager);
    }

    @throwCruxClientError
    public getAssetMap = async (): Promise<IResolvedClientAssetMap> => {
        await this._initPromise;
        if (this.resolvedClientAssetMapping) {
            return this.resolvedClientAssetMapping;
        }
        this.resolvedClientAssetMapping = this._getCruxAssetTranslator().assetIdAssetListToSymbolAssetMap(this.getCruxDomain().config.assetList);
        return this.resolvedClientAssetMapping;
    }

    private _getCruxUserByID = async (cruxIdString: string, tag?: string): Promise<CruxUser|undefined> => {
        const cruxId = CruxId.fromString(cruxIdString);
        return await this._cruxUserRepository.getByCruxId(cruxId, tag);
    }

    private _getCruxAssetTranslator = () => {
        if (!this._cruxAssetTranslator) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.MissingCruxAssetTranslator);
        }
        return this._cruxAssetTranslator;
    }

    private getCruxDomain = () => {
        if (!this.cruxDomain) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.MissingCruxDomainInCruxWalletClient);
        }
        return this.cruxDomain;
    }

    private _init = async (options: ICruxWalletClientOptions): Promise<void> => {
        const cruxDomainId = new CruxDomainId(this.walletClientName);
        this.cruxDomain = await new BlockstackCruxDomainRepository({cacheStorage: this.cacheStorage, blockstackInfrastructure: this.cruxBlockstackInfrastructure}).get(cruxDomainId);
        if (!this.cruxDomain) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.InvalidWalletClientName);
        }
        if (!this.cruxDomain.config) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.CouldNotFindBlockstackConfigurationServiceClientConfig);
        }
        if (this._keyManager) {
            this._cruxUser = await this._cruxUserRepository.getWithKey(this._keyManager, cruxDomainId);
        }
        this._cruxAssetTranslator = await new CruxAssetTranslator(this.cruxDomain.config.assetMapping);
    }
}
