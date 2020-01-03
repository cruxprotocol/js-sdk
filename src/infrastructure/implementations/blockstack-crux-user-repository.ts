import { IKeyManager } from "src/core/interfaces/key-manager";
import { CruxUser, SubdomainRegistrationStatus } from "../../core/entities/crux-user";
import { ICruxBlockstackInfrastructure } from "../../core/interfaces";
import {ICruxUserRepository, ICruxUserRepositoryOptions} from "../../core/interfaces/crux-user-repository";
import {CruxDomainId, CruxId, IdTranslator} from "../../packages/identity-utils";
import { getLogger } from "../../packages/logger";
import { StorageService } from "../../packages/storage";
import { BlockstackService } from "../services/blockstack-service";
const log = getLogger(__filename);

export interface IBlockstackCruxUserRepositoryOptions extends ICruxUserRepositoryOptions {
    blockstackInfrastructure: ICruxBlockstackInfrastructure;
    bnsOverrides?: string[];
    cacheStorage?: StorageService;
}

export class BlockstackCruxUserRepository implements ICruxUserRepository {
    private cacheStorage?: StorageService;
    private blockstackService: BlockstackService;
    constructor(options: IBlockstackCruxUserRepositoryOptions) {
        this.cacheStorage = options && options.cacheStorage;
        this.blockstackService = new BlockstackService({
            bnsOverrides: options.bnsOverrides,
            cacheStorage: this.cacheStorage,
            infrastructure: options.blockstackInfrastructure,
        });
        log.info("BlockstackCruxUserRepository initialised");
    }
    public create = async (cruxId: CruxId, keyManager: IKeyManager): Promise<CruxUser> => {
        const registrationStatus = await this.blockstackService.registerCruxId(cruxId, keyManager);
        return new CruxUser(cruxId, {}, registrationStatus);
    }
    public find = async (cruxID: CruxId): Promise<boolean> => {
        return await this.blockstackService.isCruxIdAvailable(cruxID);
    }
    public getByCruxId = async (cruxID: CruxId): Promise<CruxUser|undefined> => {
        const blockstackID = IdTranslator.cruxIdToBlockstackId(cruxID);
        const registrationStatus = await this.blockstackService.getCruxIdRegistrationStatus(cruxID);
        let addressMap = {};
        if (registrationStatus.status === SubdomainRegistrationStatus.DONE) {
            addressMap = await this.blockstackService.getAddressMap(blockstackID);
        }
        return new CruxUser(cruxID, addressMap, registrationStatus);
    }
    public getWithKey = async (keyManager: IKeyManager, cruxDomainId: CruxDomainId): Promise<CruxUser|undefined> => {
        const blockstackID = await this.blockstackService.getBlockstackIdFromKeyManager(keyManager, cruxDomainId);
        if (!blockstackID) {
            return;
        }
        const cruxID = IdTranslator.blockstackIdToCruxId(blockstackID);
        return this.getByCruxId(cruxID);
    }
    public save = async (cruxUser: CruxUser, keyManager: IKeyManager): Promise<CruxUser> => {
        await this.blockstackService.putAddressMap(cruxUser.getAddressMap(), new CruxDomainId(cruxUser.cruxID.components.domain), keyManager);
        return cruxUser;
    }
}
