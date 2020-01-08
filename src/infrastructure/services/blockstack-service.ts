import { AssertionError, deepStrictEqual } from "assert";
import { publicKeyToAddress } from "blockstack";
import { DomainRegistrationStatus } from "../../core/entities/crux-domain";
import { CruxSpec } from "../../core/entities/crux-spec";
import { IAddressMapping, ICruxUserRegistrationStatus } from "../../core/entities/crux-user";
import { SubdomainRegistrationStatus, SubdomainRegistrationStatusDetail } from "../../core/entities/crux-user";
import { IKeyManager } from "../../core/interfaces/key-manager";
import { errors } from "../../packages";
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
import { StorageService } from "../../packages/storage";
import {BlockstackNamingServiceApiClient, BlockstackSubdomainRegistrarApiClient, INameDetails} from "./api-clients";
import { GaiaService, IGaiaDetails } from "./gaia-service";

const log = getLogger(__filename);
export interface IBlockstackServiceInputOptions {
    bnsNodes: string[];
    subdomainRegistrar: string;
    cacheStorage?: StorageService;
}
export class BlockstackService {
    public static getRegisteredBlockstackNamesByAddress = async (address: string, bnsNodes: string[], cacheStorage?: StorageService): Promise<string[]> => {
        const nodePromises = bnsNodes.map(async (baseUrl) => {
            const addressNameData = await BlockstackNamingServiceApiClient.getNamesByAddress(baseUrl, address, cacheStorage);
            return addressNameData.names;
        });
        const responseArr: string[][] = await Promise.all(nodePromises);
        const commonIDs = [...(responseArr.map((arr) => new Set(arr)).reduce((a, b) => new Set([...a].filter((x) => b.has(x)))))];
        return commonIDs;
    }
    public static getNameDetails = async (blockstackName: string, bnsNodes: string[], tag?: string, cacheStorage?: StorageService): Promise<INameDetails> => {
        const responsePromises = bnsNodes.map((baseUrl) => BlockstackNamingServiceApiClient.getNameDetails(baseUrl, blockstackName, tag, cacheStorage));
        log.debug(`BNS node response promises:`, responsePromises);
        const responsesArr: object[] = await Promise.all(responsePromises);
        log.debug(`BNS resolved JSON array:`, responsesArr);
        let prevRes;
        let response: object;
        for (let i = 0; i < responsesArr.length; i++) {
            const res = responsesArr[i];
            if (i === 0) {
                prevRes = res;
            } else {
                try {
                    deepStrictEqual(prevRes, res);
                } catch (e) {
                    if (e instanceof AssertionError) {
                        throw ErrorHelper.getPackageError(e, PackageErrorCode.NameIntegrityCheckFailed);
                    } else {
                        log.error(e);
                        throw e;
                    }
                }
            }
            // TODO: unhandled else case
            if (i === responsesArr.length - 1) {
                response = responsesArr[0];
            }
        }
        // @ts-ignore
        return response;
    }
    public static getGaiaHubFromZonefile = (zonefile: string): string => {
        let gaiaHub: string;
        if (zonefile.match(new RegExp("(.+)https:\/\/hub.cruxpay.com\/hub\/(.+)\/profile.json"))) {
            const match = zonefile.match(new RegExp("(.+)https:\/\/(.+)\/hub\/(.+)\/profile.json", "s"))
            if (!match) {
                throw ErrorHelper.getPackageError(null, PackageErrorCode.CouldNotExtractGaiaDataFromZoneFile, zonefile);
            }
            gaiaHub = "https://" + match[2];
        } else {
            const match = zonefile.match(new RegExp("https:\/\/(.+)"));
            if (!match) {
                throw ErrorHelper.getPackageError(null, PackageErrorCode.CouldNotExtractGaiaDataFromZoneFile, zonefile);
            }
            gaiaHub = match.slice(0, -1)[0];
        }
        return gaiaHub;
    }
    public static getDomainRegistrationStatusFromNameDetails = (nameDetails: INameDetails): DomainRegistrationStatus => {
        let domainRegistrationStatus: DomainRegistrationStatus;
        switch (nameDetails.status) {
            case "available":
                domainRegistrationStatus = DomainRegistrationStatus.AVAILABLE;
                break;
            case "registered":
                domainRegistrationStatus = DomainRegistrationStatus.REGISTERED;
                break;
            default:
                domainRegistrationStatus = DomainRegistrationStatus.PENDING;
        }
        return domainRegistrationStatus;
    }
    private cacheStorage?: StorageService;
    private bnsNodes: string[];
    private subdomainRegistrar: string;
    constructor(options: IBlockstackServiceInputOptions) {
        this.bnsNodes = options.bnsNodes;
        this.subdomainRegistrar = options.subdomainRegistrar;
        this.cacheStorage = options.cacheStorage;
    }
    public getNameDetails = async (blockstackName: string, tag?: string): Promise<INameDetails> => {
        const nameData = await BlockstackService.getNameDetails(blockstackName, this.bnsNodes, tag, this.cacheStorage);
        log.debug(nameData);
        if (!nameData) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.BnsEmptyData);
        }
        if (!nameData.address) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.UserDoesNotExist);
        }
        return nameData;
    }
    public getDomainRegistrationStatus = async (domain: string): Promise<DomainRegistrationStatus> => {
        // TODO: interpret the domain registration status from blockchain/BNS node
        const domainBlockstackID = CruxSpec.idTranslator.cruxDomainToBlockstackDomain(new CruxDomainId(domain)).toString();
        const nameDetails = await this.getNameDetails(domainBlockstackID);
        if (!nameDetails) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.BnsResolutionFailed);
        }
        return BlockstackService.getDomainRegistrationStatusFromNameDetails(nameDetails);
    }
    public restoreDomain = async (keyManager: IKeyManager, domainContext?: string): Promise<string|undefined> => {
        const configSubdomainAddress = publicKeyToAddress(await keyManager.getPubKey());
        const registeredBlockstackIDs = await BlockstackService.getRegisteredBlockstackNamesByAddress(configSubdomainAddress, this.bnsNodes, this.cacheStorage);
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
        const registeredBlockstackIDs = await BlockstackService.getRegisteredBlockstackNamesByAddress(userSubdomainOwnerAddress, this.bnsNodes, this.cacheStorage);
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
        const registrarApiClient = new BlockstackSubdomainRegistrarApiClient(this.subdomainRegistrar, blockstackDomain);
        const pendingSubdomains = await registrarApiClient.fetchPendingRegistrationsByAddress(userSubdomainOwnerAddress);
        if (pendingSubdomains.length !== 0) {
            return new BlockstackId({domain: blockstackDomain.components.domain, subdomain: pendingSubdomains[0]});
        }
        return;
    }

    public isCruxIdAvailable = async (cruxId: CruxId): Promise<boolean> => {
        const blockstackId = IdTranslator.cruxToBlockstack(cruxId);
        validateSubdomain(cruxId.components.subdomain);
        const registrarApiClient = new BlockstackSubdomainRegistrarApiClient(this.subdomainRegistrar, new BlockstackDomainId(blockstackId.components.domain));
        const registrarStatus = await registrarApiClient.getSubdomainStatus(cruxId.components.subdomain);
        const registrationStatus = getStatusObjectFromResponse(registrarStatus);
        return registrationStatus.status === SubdomainRegistrationStatus.NONE;
    }

    public registerCruxId = async (cruxId: CruxId, gaiaHub: string, keyManager: IKeyManager): Promise<ICruxUserRegistrationStatus> => {
        if (!keyManager) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.CouldNotFindKeyPairToRegisterName);
        }
        const blockstackId = IdTranslator.cruxToBlockstack(cruxId);
        const registrarApiClient = new BlockstackSubdomainRegistrarApiClient(this.subdomainRegistrar, new BlockstackDomainId(blockstackId.components.domain));
        await registrarApiClient.registerSubdomain(cruxId.components.subdomain, gaiaHub, publicKeyToAddress(await keyManager.getPubKey()));
        return await this.getCruxIdRegistrationStatus(cruxId);
    }

    public getCruxIdRegistrationStatus = async (cruxId: CruxId): Promise<ICruxUserRegistrationStatus> => {
        log.debug("====getRegistrationStatus====");
        const blockstackId = IdTranslator.cruxToBlockstack(cruxId);
        const nameData: any = await this.getNameDetails(blockstackId.toString());
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
        const registrarApiClient = new BlockstackSubdomainRegistrarApiClient(this.subdomainRegistrar, new BlockstackDomainId(blockstackId.components.domain));
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
