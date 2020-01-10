import {CruxDomain, DomainRegistrationStatus} from "../../core/entities/crux-domain";
import {CruxSpec} from "../../core/entities/crux-spec";
import {
    CruxUser,
    IAddress,
    IAddressMapping,
    ICruxUserRegistrationStatus,
    SubdomainRegistrationStatus,
    SubdomainRegistrationStatusDetail
} from "../../core/entities/crux-user";
import {ICruxDomainRepository} from "../../core/interfaces/crux-domain-repository";
import {ICruxUserRepository} from "../../core/interfaces/crux-user-repository";
import {IKeyManager} from "../../core/interfaces/key-manager";
import {IClientConfig} from "../../packages/configuration-service";
import {CruxDomainId, CruxId} from "../../packages/identity-utils";

export class InMemoryCruxUserRepository implements ICruxUserRepository {
    private userById: any;
    constructor(){
        this.userById = {}
    }
    create = async (cruxID: CruxId, keyManager: IKeyManager): Promise<CruxUser> => {
        if (!(await this.find(cruxID))){
            throw Error("Already Exists")
        }
        const newUser = new CruxUser(cruxID, {}, {
            status: SubdomainRegistrationStatus.PENDING,
            statusDetail: SubdomainRegistrationStatusDetail.PENDING_REGISTRAR
        })
        this.userById[cruxID.toString()] = newUser
        return new Promise((resolve, reject) => resolve(newUser));
    }
    find = (cruxID: CruxId) : Promise<boolean> => {
        const result = this.userById[cruxID.toString()] === undefined;
        return new Promise((resolve, reject) => resolve(result));

    };
    getByCruxId = (cruxID: CruxId, tag?: string) : Promise<CruxUser | undefined> => {
        const result = this.userById[cruxID.toString()];
        return new Promise((resolve, reject) => resolve(result));
    }
    getWithKey = (keyManager: IKeyManager, cruxDomainId: CruxDomainId) : Promise<CruxUser | undefined> => {
        // TODO: Implement ID recovery from key
        return new Promise((resolve, reject) => resolve(undefined));
    }
    save = (cruxUser: CruxUser, keyManager: IKeyManager) : Promise<CruxUser> => {
        if (this.userById[cruxUser.cruxID.toString()] === undefined) {
            throw Error("No such domain exists");
        }
        this.userById[cruxUser.cruxID.toString()] = cruxUser;
        return new Promise((resolve, reject) => resolve(cruxUser));
    }

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
    public find = (domainId: CruxDomainId): Promise<boolean> => {
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
        if (this.domainById[cruxDomain.domainId.toString()] === undefined) {
            throw Error("No such domain exists");
        }
        this.domainById[cruxDomain.domainId.toString()] = cruxDomain;
        return new Promise((resolve, reject) => resolve(cruxDomain));
    };
}
export const addUserToRepo = async (cruxUser: CruxUser, repo: ICruxUserRepository) => {
    let createdCruxDomain = await repo.create(cruxUser.cruxID, {} as any)
    createdCruxDomain.setAddressMap(cruxUser.getAddressMap())
    repo.save(createdCruxDomain, {} as any)
    return repo
};

export const addDomainToRepo = async (cruxDomain: CruxDomain, repo: ICruxDomainRepository) => {
    let createdCruxDomain = await repo.create(cruxDomain.domainId, {} as any)
    createdCruxDomain.config = cruxDomain.config
    repo.save(cruxDomain, {} as any)
    return repo
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
    const validUserRegStatus: ICruxUserRegistrationStatus = {
        'status': SubdomainRegistrationStatus.DONE,
        'statusDetail': SubdomainRegistrationStatusDetail.DONE
    };

    return new CruxUser(testCruxId, testValidAddressMap, validUserRegStatus);
};


export const getValidCruxUser2 = () => {
    const testCruxId = CruxId.fromString('bar123@somewallet.crux');
    const testAddress: IAddress = {
        'addressHash': 'foobtcaddress2'
    };
    const BTC_ASSET_ID: string = 'd78c26f8-7c13-4909-bf62-57d7623f8ee8';
    const testValidAddressMap: IAddressMapping = {[BTC_ASSET_ID]: testAddress};
    const validUserRegStatus: ICruxUserRegistrationStatus = {
        'status': SubdomainRegistrationStatus.DONE,
        'statusDetail': SubdomainRegistrationStatusDetail.DONE
    };

    return new CruxUser(testCruxId, testValidAddressMap, validUserRegStatus);
};
