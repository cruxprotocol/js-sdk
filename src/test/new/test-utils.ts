import {Err} from "@mojotech/json-type-validation/dist/types/result";
import {CruxDomain, DomainRegistrationStatus} from "../../core/entities/crux-domain";
import {CruxUser, SubdomainRegistrationStatus, SubdomainRegistrationStatusDetail} from "../../core/entities/crux-user";
import {ICruxDomainRepository} from "../../core/interfaces/crux-domain-repository";
import {ICruxUserRepository} from "../../core/interfaces/crux-user-repository";
import {IKeyManager} from "../../core/interfaces/key-manager";
import {CruxDomainId, CruxId} from "../../packages/identity-utils";

export class InMemoryCruxUserRepository implements ICruxUserRepository {
    private userById: any;
    constructor(){
        this.userById = {}
    }
    create = async (cruxID: CruxId, keyManager: IKeyManager): Promise<CruxUser> => {
        if (await this.find(cruxID)){
            throw Error("Already Exists")
        }
        const newUser = new CruxUser(cruxID, {}, {
            status: SubdomainRegistrationStatus.DONE,
            statusDetail: SubdomainRegistrationStatusDetail.DONE
        })
        this.userById[cruxID.toString()] = newUser
        return new Promise((resolve, reject) => resolve(newUser));
    }
    find = (cruxID: CruxId) : Promise<boolean> => {
        const result = this.userById[cruxID.toString()] !== undefined;
        return new Promise((resolve, reject) => resolve(result));

    };
    getByCruxId = (cruxID: CruxId, tag?: string) : Promise<CruxUser | undefined> => {
        const result = this.userById[cruxID.toString()];
        return new Promise((resolve, reject) => resolve(result));
    }
    getWithKey = (keyManager: IKeyManager, cruxDomainId: CruxDomainId) : Promise<CruxUser | undefined> => {
        throw Error("Not implemented")
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
