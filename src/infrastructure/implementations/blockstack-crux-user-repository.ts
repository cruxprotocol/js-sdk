import { CruxSpec } from "src/core/entities/crux-spec";
import { IKeyManager } from "src/core/interfaces/key-manager";
import { CruxUser } from "../../core/entities/crux-user";
import { ICruxUserRepositoryOptions } from "../../core/interfaces/crux-user-repository";
import {CruxDomainId, CruxId, IdTranslator} from "../../packages/identity-utils";
import { getLogger } from "../../packages/logger";
import { BlockstackService } from "../services/blockstack-service";
const log = getLogger(__filename);

export interface IBlockstackCruxUserRepositoryOptions extends ICruxUserRepositoryOptions {
    bnsNodes?: string[];
    cruxDomainId: CruxDomainId;
}

export class BlockstackCruxUserRepository implements ICruxUserRepositoryOptions {
    private _bnsNodes: string[];
    private _cruxDomainId: CruxDomainId;
    constructor(options: IBlockstackCruxUserRepositoryOptions) {
        this._bnsNodes = options && options.bnsNodes && [...new Set([...BlockstackService.infrastructure.bnsNodes, ...options.bnsNodes])] || BlockstackService.infrastructure.bnsNodes;
        this._cruxDomainId = options && options.cruxDomainId;
        log.info("BlockstackCruxUserRepository initialised");
    }
    public getByCruxId = async (cruxID: CruxId): Promise<CruxUser|undefined> => {
        const blockstackID = IdTranslator.cruxIdToBlockstackId(cruxID);
        const addressMap = await BlockstackService.getAddressMap(blockstackID, this._bnsNodes);
        return new CruxUser(cruxID, addressMap);
    }
    public getWithKey = async (keyManager: IKeyManager): Promise<CruxUser|undefined> => {
        const blockstackID = await BlockstackService.getBlockstackIdFromKeyManager(keyManager, this._cruxDomainId, this._bnsNodes);
        if (!blockstackID) {
            return;
        }
        const cruxID = IdTranslator.blockstackIdToCruxId(blockstackID);
        const addressMap = await BlockstackService.getAddressMap(blockstackID, this._bnsNodes);
        return new CruxUser(cruxID, addressMap);
    }
}
