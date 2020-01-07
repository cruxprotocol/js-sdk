import { publicKeyToAddress } from "blockstack";
import { DomainRegistrationStatus } from "../../core/entities/crux-domain";
import { CruxSpec } from "../../core/entities/crux-spec";
import { IAddressMapping, ICruxUserRegistrationStatus } from "../../core/entities/crux-user";
import { SubdomainRegistrationStatus, SubdomainRegistrationStatusDetail } from "../../core/entities/crux-user";
import { ICruxBlockstackInfrastructure } from "../../core/interfaces";
import { IKeyManager } from "../../core/interfaces/key-manager";
import { errors } from "../../packages";
import { IClientConfig } from "../../packages/configuration-service";
import { ErrorHelper, PackageErrorCode } from "../../packages/error";
import { getContentFromGaiaHub, getGaiaDataFromBlockstackID } from "../../packages/gaia-service/utils";
import {
    BlockstackDomainId,
    BlockstackId,
    CruxDomainId,
    CruxId,
    IdTranslator,
    validateSubdomain,
} from "../../packages/identity-utils";
import { getLogger } from "../../packages/logger";
import { fetchNameDetails, INameDetailsObject } from "../../packages/name-service/utils";
import { StorageService } from "../../packages/storage";
import {BlockstackNamingServiceApiClient, BlockstackSubdomainRegistrarApiClient} from "./api-clients";
import { GaiaService } from "./gaia-service";

const log = getLogger(__filename);
export interface IBlockstackServiceInputOptions {
    infrastructure: ICruxBlockstackInfrastructure;
    cacheStorage?: StorageService;
    bnsOverrides?: string[];
}
export class BlockstackService {
    public static fetchIDsByAddress = async (baseUrl: string, address: string): Promise<string[]> => {
        const bnsApiClient = new BlockstackNamingServiceApiClient(baseUrl);
        return bnsApiClient.fetchIDsByAddress(address);
    }
    public static getDomainRegistrationStatusFromNameDetails = (nameDetails: INameDetailsObject): DomainRegistrationStatus => {
        let domainRegistrationStatus: DomainRegistrationStatus;
        switch (nameDetails.status) {
            case "available":
                domainRegistrationStatus = DomainRegistrationStatus.AVAILABLE;
            case "registered":
                domainRegistrationStatus = DomainRegistrationStatus.REGISTERED;
            default:
                domainRegistrationStatus = DomainRegistrationStatus.PENDING;
        }
        return domainRegistrationStatus;
    }
    private cacheStorage?: StorageService;
    private bnsNodes: string[];
    private subdomainRegistrar: string;
    private gaiaHub: string;
    constructor(options: IBlockstackServiceInputOptions) {
        this.bnsNodes = options.bnsOverrides && [...new Set([...options.infrastructure.bnsNodes, ...options.bnsOverrides])] || options.infrastructure.bnsNodes;
        this.gaiaHub = options.infrastructure.gaiaHub;
        this.subdomainRegistrar = options.infrastructure.subdomainRegistrar;
        this.cacheStorage = options.cacheStorage;
    }
    public getDomainRegistrationStatus = async (domain: string): Promise<DomainRegistrationStatus> => {
        // TODO: interpret the domain registration status from blockchain/BNS node
        const domainBlockstackID = CruxSpec.idTranslator.cruxDomainToBlockstackDomain(new CruxDomainId(domain)).toString();
        const nameDetails = await fetchNameDetails(domainBlockstackID, this.bnsNodes, undefined, this.cacheStorage);
        if (!nameDetails) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.BnsResolutionFailed);
        }
        return BlockstackService.getDomainRegistrationStatusFromNameDetails(nameDetails);
    }
    public getRegisteredIDsByAddress = async (address: string): Promise<string[]> => {
        const nodePromises = this.bnsNodes.map((baseUrl) => BlockstackService.fetchIDsByAddress(baseUrl, address));
        const responseArr: string[][] = await Promise.all(nodePromises);
        const commonIDs = [...(responseArr.map((arr) => new Set(arr)).reduce((a, b) => new Set([...a].filter((x) => b.has(x)))))];
        return commonIDs;
    }
    public getClientConfig = async (domain: string): Promise<IClientConfig> => {
        const configBlockstackID = CruxSpec.blockstack.getConfigBlockstackID(domain);
        const domainConfigFileName = CruxSpec.blockstack.getDomainConfigFileName(domain);
        return getContentFromGaiaHub(configBlockstackID, domainConfigFileName, this.bnsNodes, undefined, this.cacheStorage);
    }
    public putClientConfig = async (domain: string, clientConfig: IClientConfig, keyManager: IKeyManager): Promise<string> => {
        const configBlockstackID = CruxSpec.blockstack.getConfigBlockstackID(domain);
        const domainConfigFileName = CruxSpec.blockstack.getDomainConfigFileName(domain);
        const gaiaDetails = await getGaiaDataFromBlockstackID(configBlockstackID, this.bnsNodes, undefined, this.cacheStorage);
        const finalURL = await new GaiaService(gaiaDetails.gaiaWriteUrl).uploadContentToGaiaHub(domainConfigFileName, clientConfig, keyManager);
        log.info(`clientConfig saved to: ${finalURL}`);
        return finalURL;
    }
    public restoreDomain = async (keyManager: IKeyManager, domainContext?: string): Promise<string|undefined> => {
        const configSubdomainAddress = publicKeyToAddress(await keyManager.getPubKey());
        const registeredBlockstackIDs = await this.getRegisteredIDsByAddress(configSubdomainAddress);
        const registeredDomainArray = registeredBlockstackIDs
            .map((blockstackID: string) => blockstackID.match(new RegExp("^_config.(.+)_crux.id$")))
            .map((match) => match && match[1])
            .filter((domain) => domain !== undefined) as string[];
        if (domainContext && registeredDomainArray.includes(domainContext)) {
            return domainContext;
        } else if (registeredDomainArray.length === 1) {
            return registeredDomainArray[0];
        }
    }
    public getAddressMap = async (blockstackID: BlockstackId, tag?: string): Promise<IAddressMapping> => {
        const cruxPayFileName = CruxSpec.blockstack.getCruxPayFilename(blockstackID);
        return getContentFromGaiaHub(blockstackID.toString(), cruxPayFileName, this.bnsNodes, tag, this.cacheStorage);
    }
    public putAddressMap = async (addressMapping: IAddressMapping, cruxDomainId: CruxDomainId, keyManager: IKeyManager): Promise<string> => {
        const blockstackID = await this.getBlockstackIdFromKeyManager(keyManager, cruxDomainId);
        if (!blockstackID) {
            throw errors.ErrorHelper.getPackageError(null, errors.PackageErrorCode.UserDoesNotExist);
        }
        const cruxPayFileName = CruxSpec.blockstack.getCruxPayFilename(blockstackID);
        const gaiaDetails = await getGaiaDataFromBlockstackID(blockstackID.toString(), this.bnsNodes, undefined, this.cacheStorage);
        const finalURL = await new GaiaService(gaiaDetails.gaiaWriteUrl).uploadContentToGaiaHub(cruxPayFileName, addressMapping, keyManager);
        log.info(`Address Map for ${blockstackID} saved to: ${finalURL}`);
        return finalURL;
    }
    public getBlockstackIdFromKeyManager = async (keyManager: IKeyManager, cruxDomainId: CruxDomainId): Promise<BlockstackId|undefined> => {
        const userSubdomainOwnerAddress = publicKeyToAddress(await keyManager.getPubKey());
        const registeredBlockstackIDs = await this.getRegisteredIDsByAddress(userSubdomainOwnerAddress);
        const registeredDomainArray = registeredBlockstackIDs
            .map((blockstackID: string) => blockstackID.match(new RegExp(`(.+)\.${IdTranslator.cruxToBlockstack(cruxDomainId).toString()}`)))
            .map((match) => match && match[0])
            .filter(Boolean) as string[];
        if (registeredDomainArray.length > 1) {
            log.error(`More than one cruxIDs associated with: ${userSubdomainOwnerAddress}`);
        }
        if (registeredDomainArray[0]) {
            return BlockstackId.fromString(registeredDomainArray[0]);
        }
        const blockstackDomain: BlockstackDomainId = IdTranslator.cruxDomainToBlockstackDomain(cruxDomainId);
        // Fetch any pending registrations on the address using the registrar
        const registrarApiClient = new BlockstackSubdomainRegistrarApiClient(this.subdomainRegistrar, blockstackDomain.components.domain);
        const pendingSubdomains = await registrarApiClient.fetchPendingRegistrationsByAddress(userSubdomainOwnerAddress);
        if (pendingSubdomains.length !== 0) {
            return new BlockstackId({domain: blockstackDomain.components.domain, subdomain: pendingSubdomains[0]});
        }
        return;
    }

    public isCruxIdAvailable = async (cruxId: CruxId): Promise<boolean> => {
        const blockstackId = IdTranslator.cruxToBlockstack(cruxId);
        validateSubdomain(cruxId.components.subdomain);
        const registrarApiClient = new BlockstackSubdomainRegistrarApiClient(this.subdomainRegistrar, blockstackId.components.domain);
        const registrarStatus = await registrarApiClient.getSubdomainStatus(cruxId.components.subdomain);
        const registrationStatus = getStatusObjectFromResponse(registrarStatus);
        return registrationStatus.status === SubdomainRegistrationStatus.NONE;
    }

    public registerCruxId = async (cruxId: CruxId, keyManager: IKeyManager): Promise<ICruxUserRegistrationStatus> => {
        if (!keyManager) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.CouldNotFindKeyPairToRegisterName);
        }
        const blockstackId = IdTranslator.cruxToBlockstack(cruxId);
        const registrarApiClient = new BlockstackSubdomainRegistrarApiClient(this.subdomainRegistrar, blockstackId.components.domain);
        await registrarApiClient.registerSubdomain(cruxId.components.subdomain, this.gaiaHub, publicKeyToAddress(await keyManager.getPubKey()));
        return await this.getCruxIdRegistrationStatus(cruxId);
    }

    public getCruxIdRegistrationStatus = async (cruxId: CruxId): Promise<ICruxUserRegistrationStatus> => {
        log.debug("====getRegistrationStatus====");
        const blockstackId = IdTranslator.cruxToBlockstack(cruxId);
        const nameData: any = await fetchNameDetails(blockstackId.toString(), this.bnsNodes, undefined, this.cacheStorage);
        let status: SubdomainRegistrationStatus;
        let statusDetail: SubdomainRegistrationStatusDetail = SubdomainRegistrationStatusDetail.NONE;
        if (nameData.status === "registered_subdomain") {
            // if (nameData.address === identityClaim.secrets.identityKeyPair.address) {
            status = SubdomainRegistrationStatus.DONE;
            statusDetail = SubdomainRegistrationStatusDetail.DONE;
            // } else {
            //     status = SubdomainRegistrationStatus.REJECT;
            // }
            return {
                status,
                statusDetail,
            };
        }
        const registrarApiClient = new BlockstackSubdomainRegistrarApiClient(this.subdomainRegistrar, blockstackId.components.domain);
        const registrarStatus = await registrarApiClient.getSubdomainStatus(cruxId.components.subdomain);
        const registrationStatus = getStatusObjectFromResponse(registrarStatus);
        return registrationStatus;
    }
}

const getStatusObjectFromResponse = (body: any): ICruxUserRegistrationStatus =>  {
    let status: ICruxUserRegistrationStatus;
    const rawStatus = body.status;
    log.info(body);
    if (rawStatus && rawStatus.includes("Your subdomain was registered in transaction")) {
        status = {
            status: SubdomainRegistrationStatus.PENDING,
            statusDetail: SubdomainRegistrationStatusDetail.PENDING_REGISTRAR,
        };
    } else {
        switch (rawStatus) {
            case "Subdomain not registered with this registrar":
                status = {
                    status: SubdomainRegistrationStatus.NONE,
                    statusDetail: SubdomainRegistrationStatusDetail.NONE,
                };
                break;
            case "Subdomain is queued for update and should be announced within the next few blocks.":
                status = {
                    status: SubdomainRegistrationStatus.PENDING,
                    statusDetail: SubdomainRegistrationStatusDetail.PENDING_BLOCKCHAIN,
                };
                break;
            case "Subdomain propagated":
                log.debug("Skipping this because meant to be done by BNS node");
            default:
                status = {
                    status: SubdomainRegistrationStatus.NONE,
                    statusDetail: SubdomainRegistrationStatusDetail.NONE,
                };
                break;
        }
    }
    return status;
};
