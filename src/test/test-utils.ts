import {publicKeyToAddress} from "blockstack/lib";
import {CruxDomain, DomainRegistrationStatus, IClientConfig} from "../core/entities/crux-domain";
import {CruxSpec} from "../core/entities/crux-spec";
import {
    CruxUser,
    IAddress,
    IAddressMapping,
    ICruxUserRegistrationStatus,
    SubdomainRegistrationStatus,
    SubdomainRegistrationStatusDetail,
    ICruxUserInformation,
    ICruxUserConfiguration
} from "../core/entities/crux-user";
import {ICruxDomainRepository} from "../core/interfaces/crux-domain-repository";
import {ICruxUserRepository} from "../core/interfaces/crux-user-repository";
import {IKeyManager} from "../core/interfaces/key-manager";
import {CruxDomainId, CruxId} from "../packages/identity-utils";

class MockUserStore {
    private userById: any;
    private userByKeyAndDomain: any;

    constructor() {
        this.userById = {};
        this.userByKeyAndDomain = {};
    }

    public store = (cruxUser: CruxUser, address: string) => {
        this.userById[cruxUser.cruxID.toString()] = cruxUser;
        this.userByKeyAndDomain[String([address, cruxUser.cruxID.components.domain])] = cruxUser;
    };
    public getById = (cruxId: CruxId) => {
        return this.userById[cruxId.toString()];
    };
    public getByOwnerAddressAndDomain = (address: string, cruxDomainId: CruxDomainId) => {
        return this.userByKeyAndDomain[String([address, cruxDomainId.components.domain])];
    };
}

export class InMemoryCruxUserRepository implements ICruxUserRepository {
    private userStore: MockUserStore;

    constructor() {
        this.userStore = new MockUserStore();
    }

    create = async (cruxID: CruxId, keyManager: IKeyManager): Promise<CruxUser> => {
        if (!(await this.isCruxIdAvailable(cruxID))) {
            throw Error("Already Exists");
        }
        const newUser = new CruxUser(cruxID, {}, {
            registrationStatus: {
                status: SubdomainRegistrationStatus.PENDING,
                statusDetail: SubdomainRegistrationStatusDetail.PENDING_REGISTRAR,
            }
        },{
            enabledParentAssetFallbacks: [],
        });
        const addressFromKeyManager = publicKeyToAddress(await keyManager.getPubKey());
        this.userStore.store(newUser, addressFromKeyManager);
        return new Promise((resolve, reject) => resolve(newUser));
    };
    isCruxIdAvailable = (cruxID: CruxId): Promise<boolean> => {
        const result = this.userStore.getById(cruxID) === undefined;
        return new Promise((resolve, reject) => resolve(result));
    };
    getByCruxId = (cruxID: CruxId, tag?: string): Promise<CruxUser | undefined> => {
        const result = this.userStore.getById(cruxID);
        return new Promise((resolve, reject) => resolve(result));
    };
    getWithKey = async (keyManager: IKeyManager, cruxDomainId: CruxDomainId): Promise<CruxUser | undefined> => {
        const addressFromKeyManager = publicKeyToAddress(await keyManager.getPubKey());
        const result = this.userStore.getByOwnerAddressAndDomain(addressFromKeyManager, cruxDomainId);
        return new Promise((resolve, reject) => resolve(result));
    };
    save = async (cruxUser: CruxUser, keyManager: IKeyManager): Promise<CruxUser> => {
        if (this.userStore.getById(cruxUser.cruxID) === undefined) {
            throw Error("Cannot Save, No such CruxUser exists with this ID");
        }
        const addressFromKeyManager = publicKeyToAddress(await keyManager.getPubKey());
        if (this.userStore.getByOwnerAddressAndDomain(addressFromKeyManager, new CruxDomainId(cruxUser.cruxID.components.domain)) === undefined) {
            throw Error("User exists but provided Key is wrong");
        }
        this.userStore.store(cruxUser, addressFromKeyManager);
        return new Promise((resolve, reject) => resolve(cruxUser));
    };

}

export class InMemoryCruxDomainRepository implements ICruxDomainRepository {
    private domainById: any;

    constructor() {
        this.domainById = {};
    }

    public create = (domainId: CruxDomainId, identityKeyManager: IKeyManager): Promise<CruxDomain> => {
        const newDomain = new CruxDomain(domainId, DomainRegistrationStatus.REGISTERED, {} as any);
        this.domainById[domainId.toString()] = newDomain;
        return new Promise((resolve, reject) => resolve(newDomain));
    };
    public isCruxDomainIdAvailable = (domainId: CruxDomainId): Promise<boolean> => {
        const result = this.domainById[domainId.toString()] !== undefined;
        return new Promise((resolve, reject) => resolve(result));
    };
    public get = (domainId: CruxDomainId): Promise<CruxDomain | undefined> => {
        const result = this.domainById[domainId.toString()];
        return new Promise((resolve, reject) => resolve(result));
    };
    public getWithConfigKeyManager = (keyManager: IKeyManager, domainId?: CruxDomainId): Promise<CruxDomain | undefined> => {
        throw Error("Not defined");
    };
    public save = (cruxDomain: CruxDomain, keyManager: IKeyManager): Promise<CruxDomain> => {
        if (this.domainById[cruxDomain.id.toString()] === undefined) {
            throw Error("No such domain exists");
        }
        this.domainById[cruxDomain.id.toString()] = cruxDomain;
        return new Promise((resolve, reject) => resolve(cruxDomain));
    };
}

export const addUserToRepo = async (cruxUser: CruxUser, repo: ICruxUserRepository, keyManager: IKeyManager) => {
    let createdCruxDomain = await repo.create(cruxUser.cruxID, keyManager);
    createdCruxDomain.setAddressMap(cruxUser.getAddressMap());
    repo.save(createdCruxDomain, keyManager);
    return repo;
};

export const addDomainToRepo = async (cruxDomain: CruxDomain, repo: ICruxDomainRepository) => {
    // TODO: KeyManager is not used properly here to create domain
    let createdCruxDomain = await repo.create(cruxDomain.id, {} as any);
    createdCruxDomain.config = cruxDomain.config;
    repo.save(cruxDomain, {} as any);
    return repo;
};

export const getValidCruxDomain = () => {
    const testCruxDomainId = CruxDomainId.fromString('somewallet.crux');
    const domainStatus: DomainRegistrationStatus = DomainRegistrationStatus.REGISTERED;
    const testValidDomainAssetMapping = {
        'bitcoin': 'd78c26f8-7c13-4909-bf62-57d7623f8ee8',
        'ethereum': '4e4d9982-3469-421b-ab60-2c0c2f05386a'
    };
    const testValidDomainConfig: IClientConfig = {
        assetMapping: testValidDomainAssetMapping,
        assetList: CruxSpec.globalAssetList.filter((asset) => Object.values(testValidDomainAssetMapping).includes(asset.assetId)),
    };
    return new CruxDomain(testCruxDomainId, domainStatus, testValidDomainConfig);
};
export const getValidCruxUser = () => {
    const testCruxId = CruxId.fromString('foo123@testwallet.crux');
    const testAddress: IAddress = {
        'addressHash': 'foobtcaddress'
    };
    const BTC_ASSET_ID: string = 'd78c26f8-7c13-4909-bf62-57d7623f8ee8';
    const testValidAddressMap: IAddressMapping = {[BTC_ASSET_ID]: testAddress};
    const validUserInformation: ICruxUserInformation = {
        registrationStatus: {
            'status': SubdomainRegistrationStatus.DONE,
            'statusDetail': SubdomainRegistrationStatusDetail.DONE,
        }
    };
    const validUserConfiguration: ICruxUserConfiguration = {
        enabledParentAssetFallbacks: [],
    }

    return new CruxUser(testCruxId, testValidAddressMap, validUserInformation, validUserConfiguration);
};

export const getValidCruxUser2 = () => {
    const testCruxId = CruxId.fromString('bar123@somewallet.crux');
    const testAddress: IAddress = {
        'addressHash': 'foobtcaddress2'
    };
    const BTC_ASSET_ID: string = 'd78c26f8-7c13-4909-bf62-57d7623f8ee8';
    const testValidAddressMap: IAddressMapping = {[BTC_ASSET_ID]: testAddress};
    const validUserInformation: ICruxUserInformation = {
        registrationStatus: {
            'status': SubdomainRegistrationStatus.DONE,
            'statusDetail': SubdomainRegistrationStatusDetail.DONE,
        }
    };
    const validUserConfiguration: ICruxUserConfiguration = {
        enabledParentAssetFallbacks: [],
    }

    return new CruxUser(testCruxId, testValidAddressMap, validUserInformation, validUserConfiguration);
};
