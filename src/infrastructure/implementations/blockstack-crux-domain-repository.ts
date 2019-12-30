import { CruxDomain } from "../../core/entities/crux-domain";
import { DomainRegistrationStatus } from "../../core/entities/crux-domain";
import { ICruxDomainRepository, ICruxDomainRepositoryOptions } from "../../core/interfaces/crux-domain-repository";
import { IKeyManager } from "../../core/interfaces/key-manager";
import { ErrorHelper, PackageErrorCode } from "../../packages/error";
import { CruxDomainId } from "../../packages/identity-utils";
import { getLogger } from "../../packages/logger";
import { BlockstackService } from "../services/blockstack-service";
const log = getLogger(__filename);
export interface IBlockstackCruxDomainRepositoryOptions extends ICruxDomainRepositoryOptions {
    bnsNodes?: string[];
}
export class BlockstackCruxDomainRepository implements ICruxDomainRepository {
    private _bnsNodes: string[];
    constructor(options?: IBlockstackCruxDomainRepositoryOptions) {
        this._bnsNodes = options && options.bnsNodes && [...new Set([...BlockstackService.infrastructure.bnsNodes, ...options.bnsNodes])] || BlockstackService.infrastructure.bnsNodes;
        log.info("BlockstackCruxDomainRepository initialised");
    }
    public find = async (domainId: CruxDomainId): Promise<boolean> => {
        const domainRegistrationStatus = await BlockstackService.getDomainRegistrationStatus(domainId.components.domain, this._bnsNodes);
        return domainRegistrationStatus === DomainRegistrationStatus.AVAILABLE ? true : false;
    }
    public create = async (domainId: CruxDomainId, keyManager: IKeyManager): Promise<CruxDomain> => {
        // TODO: register the domain on bitcoin blockchain and _config subdomain on domain provided SubdomainRegistrar service
        throw ErrorHelper.getPackageError(null, PackageErrorCode.IsNotSupported);
    }
    public get = async (domainId: CruxDomainId): Promise<CruxDomain|undefined> => {
        const domainRegistrationStatus = await BlockstackService.getDomainRegistrationStatus(domainId.components.domain, this._bnsNodes);
        if (domainRegistrationStatus === DomainRegistrationStatus.AVAILABLE) {
            return;
        }
        const domainClientConfig = await BlockstackService.getClientConfig(domainId.components.domain, this._bnsNodes);
        return new CruxDomain(domainId, domainRegistrationStatus, domainClientConfig);
    }
    public save = async (cruxDomain: CruxDomain, configKeyManager: IKeyManager): Promise<CruxDomain> => {
        await BlockstackService.putClientConfig(cruxDomain.domainId.components.domain, cruxDomain.config, this._bnsNodes, configKeyManager);
        return cruxDomain;
    }
    public restore = async (keyManager: IKeyManager, domainId?: CruxDomainId): Promise<CruxDomain|undefined> => {
        const associatedDomain = await BlockstackService.restoreDomain(keyManager, this._bnsNodes, domainId && domainId.components.domain);
        if (!associatedDomain) {
            return;
        }
        const domainClientConfig = await BlockstackService.getClientConfig(associatedDomain, this._bnsNodes);
        return new CruxDomain(new CruxDomainId(associatedDomain), DomainRegistrationStatus.REGISTERED, domainClientConfig);
    }
}
