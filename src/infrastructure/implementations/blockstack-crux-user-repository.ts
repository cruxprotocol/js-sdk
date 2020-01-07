import { IKeyManager } from "src/core/interfaces/key-manager";
import {CruxDomain} from "../../core/entities/crux-domain";
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
    cacheStorage?: StorageService;
    cruxDomain?: CruxDomain;
}

export class BlockstackCruxUserRepository implements ICruxUserRepository {
    private cacheStorage?: StorageService;
    private blockstackService: BlockstackService;
    constructor(options: IBlockstackCruxUserRepositoryOptions) {
        this.cacheStorage = options && options.cacheStorage;
        const infrastructure = options.blockstackInfrastructure;
        if (options.cruxDomain) {
            const domainBnsOverrides = options.cruxDomain.config.nameserviceConfiguration ? options.cruxDomain.config.nameserviceConfiguration.bnsNodes : undefined;
            infrastructure.bnsNodes = domainBnsOverrides && [...new Set([...infrastructure.bnsNodes, ...domainBnsOverrides])] || infrastructure.bnsNodes;
            // CruxDomain can override registrar here
        }
        this.blockstackService = new BlockstackService({
            cacheStorage: this.cacheStorage,
            infrastructure,
        });
        log.info("BlockstackCruxUserRepository initialised");
    }
    public create = async (cruxId: CruxId, keyManager: IKeyManager): Promise<CruxUser> => {
        const registrationStatus = await this.blockstackService.registerCruxId(cruxId, keyManager);
        return new CruxUser(cruxId, {}, registrationStatus);
    }
    public find = async (cruxID: CruxId): Promise<boolean> => {
        return this.blockstackService.isCruxIdAvailable(cruxID);
    }
    public getByCruxId = async (cruxID: CruxId, tag?: string): Promise<CruxUser|undefined> => {
        const blockstackID = IdTranslator.cruxIdToBlockstackId(cruxID);
        const registrationStatus = await this.blockstackService.getCruxIdRegistrationStatus(cruxID);
        let addressMap = {};
        if (registrationStatus.status === SubdomainRegistrationStatus.DONE) {
            addressMap = await this.blockstackService.getAddressMap(blockstackID, tag);
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
