import { CruxSpec } from "src/core/entities/crux-spec";
import { IKeyManager } from "src/core/interfaces/key-manager";
import { CruxUser, SubdomainRegistrationStatus } from "../../core/entities/crux-user";
import {ICruxUserRepository, ICruxUserRepositoryOptions} from "../../core/interfaces/crux-user-repository";
import {CruxDomainId, CruxId, IdTranslator} from "../../packages/identity-utils";
import { getLogger } from "../../packages/logger";
import { BlockstackService } from "../services/blockstack-service";
const log = getLogger(__filename);

export interface IBlockstackCruxUserRepositoryOptions extends ICruxUserRepositoryOptions {
    bnsNodes?: string[];
}

export class BlockstackCruxUserRepository implements ICruxUserRepository {
    private _bnsNodes: string[];
    constructor(options?: IBlockstackCruxUserRepositoryOptions) {
        this._bnsNodes = options && options.bnsNodes && [...new Set([...BlockstackService.infrastructure.bnsNodes, ...options.bnsNodes])] || BlockstackService.infrastructure.bnsNodes;
        log.info("BlockstackCruxUserRepository initialised");
    }
    public create = async (cruxId: CruxId, keyManager: IKeyManager): Promise<CruxUser> => {
        const registrationStatus = await BlockstackService.registerCruxId(cruxId, keyManager, this._bnsNodes);
        return new CruxUser(cruxId, {}, registrationStatus);
    }
    public find = async (cruxID: CruxId): Promise<boolean> => {
        return await BlockstackService.isCruxIdAvailable(cruxID);
    }
    public getByCruxId = async (cruxID: CruxId): Promise<CruxUser|undefined> => {
        const blockstackID = IdTranslator.cruxIdToBlockstackId(cruxID);
        const registrationStatus = await BlockstackService.getCruxIdRegistrationStatus(cruxID, this._bnsNodes);
        let addressMap = {};
        if (registrationStatus.status === SubdomainRegistrationStatus.DONE) {
            addressMap = await BlockstackService.getAddressMap(blockstackID, this._bnsNodes);
        }
        return new CruxUser(cruxID, addressMap, registrationStatus);
    }
    public getWithKey = async (keyManager: IKeyManager, cruxDomainId: CruxDomainId): Promise<CruxUser|undefined> => {
        const blockstackID = await BlockstackService.getBlockstackIdFromKeyManager(keyManager, cruxDomainId, this._bnsNodes);
        if (!blockstackID) {
            return;
        }
        const cruxID = IdTranslator.blockstackIdToCruxId(blockstackID);
        return this.getByCruxId(cruxID);
    }
    public save = async (cruxUser: CruxUser, keyManager: IKeyManager): Promise<CruxUser> => {
        await BlockstackService.putAddressMap(cruxUser.getAddressMap(), new CruxDomainId(cruxUser.cruxID.components.domain), keyManager, this._bnsNodes);
        return cruxUser;
    }
}
