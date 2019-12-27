import { CruxDomain } from "../../core/entities/crux-domain";
import { DomainRegistrationStatus } from "../../core/entities/crux-domain";
import { CruxSpec } from "../../core/entities/crux-spec";
import { ICruxDomainRepository, ICruxDomainRepositoryOptions } from "../../core/interfaces/crux-domain-repository";
import { IKeyManager } from "../../core/interfaces/key-manager";
import { ErrorHelper, PackageErrorCode } from "../../packages/error";
import { getLogger } from "../../packages/logger";
import { BlockstackService } from "../services/blockstack-service";
const log = getLogger(__filename);
export interface IBlockstackCruxDomainRepositoryOptions extends ICruxDomainRepositoryOptions {
    bnsNodes?: string[];
    domainContext?: string;
}
export class BlockstackCruxDomainRepository implements ICruxDomainRepository {
    private _bnsNodes: string[];
    private _domainContext?: string;
    constructor(options?: IBlockstackCruxDomainRepositoryOptions) {
        this._bnsNodes = options && options.bnsNodes && [...new Set([...CruxSpec.blockstack.bnsNodes, ...options.bnsNodes])] || CruxSpec.blockstack.bnsNodes;
        this._domainContext = options && options.domainContext;
        log.info("BlockstackCruxDomainRepository initialised");
    }
    public find = async (domain: string): Promise<boolean> => {
        const domainRegistrationStatus = await BlockstackService.getDomainRegistrationStatus(domain, this._bnsNodes);
        return domainRegistrationStatus === DomainRegistrationStatus.AVAILABLE ? true : false;
    }
    public create = async (domain: string, keyManager: IKeyManager): Promise<CruxDomain> => {
        // TODO: register the domain on bitcoin blockchain and _config subdomain on domain provided SubdomainRegistrar service
        throw ErrorHelper.getPackageError(null, PackageErrorCode.IsNotSupported);
    }
    public get = async (domain: string): Promise<CruxDomain|undefined> => {
        const domainRegistrationStatus = await BlockstackService.getDomainRegistrationStatus(domain, this._bnsNodes);
        if (domainRegistrationStatus === DomainRegistrationStatus.AVAILABLE) {
            return;
        }
        const domainClientConfig = await BlockstackService.getClientConfig(domain, this._bnsNodes);
        return new CruxDomain(domain, domainRegistrationStatus, domainClientConfig.nameserviceConfiguration);
    }
    public save = async (cruxDomain: CruxDomain, configKeyManager: IKeyManager): Promise<CruxDomain> => {
        const clientConfig = await BlockstackService.getClientConfig(cruxDomain.domain, this._bnsNodes);
        clientConfig.nameserviceConfiguration = cruxDomain.config.nameserviceConfig;
        await BlockstackService.putClientConfig(cruxDomain.domain, clientConfig, this._bnsNodes, configKeyManager);
        return cruxDomain;
    }
    public restore = async (keyManager: IKeyManager): Promise<CruxDomain|undefined> => {
        const associatedDomain = await BlockstackService.restoreDomain(keyManager, this._bnsNodes, this._domainContext);
        if (!associatedDomain) {
            return;
        }
        const domainClientConfig = await BlockstackService.getClientConfig(associatedDomain, this._bnsNodes);
        return new CruxDomain(associatedDomain, DomainRegistrationStatus.REGISTERED, domainClientConfig.nameserviceConfiguration);
    }
}
