import { AssertionError, deepStrictEqual } from "assert";
import { publicKeyToAddress } from "blockstack";
import { DomainRegistrationStatus } from "../../core/entities/crux-domain";
import { CruxSpec } from "../../core/entities/crux-spec";
import { ICruxUserInformation, ICruxUserRegistrationStatus } from "../../core/entities/crux-user";
import { SubdomainRegistrationStatus, SubdomainRegistrationStatusDetail } from "../../core/entities/crux-user";
import { IKeyManager } from "../../core/interfaces/key-manager";
import { BaseError, ErrorHelper, PackageErrorCode } from "../../packages/error";
import {
    BlockstackDomainId,
    BlockstackId,
    CruxDomainId,
    CruxId,
} from "../../packages/identity-utils";
import { getLogger } from "../../packages/logger";
import { StorageService } from "../../packages/storage";
import {BlockstackNamingServiceApiClient, BlockstackSubdomainRegistrarApiClient, INameDetails} from "./api-clients";

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
        const responsesArr: INameDetails[] = await Promise.all(responsePromises);
        log.debug(`BNS resolved JSON array:`, responsesArr);
        const nameDetails: INameDetails = responsesArr.reduce((previousResponse, response) => {
            try {
                deepStrictEqual(previousResponse, response);
            } catch (e) {
                if (e instanceof AssertionError) {
                    throw ErrorHelper.getPackageError(e, PackageErrorCode.NameIntegrityCheckFailed);
                }
                log.error(e);
                throw e;
            }
            return response;
        });
        log.debug(nameDetails);
        if (!nameDetails) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.BnsEmptyData);
        }
        return nameDetails;
    }
    public static getGaiaHubFromZonefile = (zonefile: string): string => {
        let gaiaHub: string;
        if (zonefile.match(new RegExp("(.+)https:\/\/hub.cruxpay.com\/hub\/(.+)\/profile.json"))) {
            const match = zonefile.match(new RegExp("(.+)https:\/\/(.+)\/hub\/(.+)\/profile.json", "s"));
            if (!match) {
                throw ErrorHelper.getPackageError(null, PackageErrorCode.FailedToGetGaiaUrlFromZonefile, zonefile);
            }
            gaiaHub = "https://" + match[2];
        } else {
            const match = zonefile.match(new RegExp("https:\/\/(.+)"));
            if (!match) {
                throw ErrorHelper.getPackageError(null, PackageErrorCode.FailedToGetGaiaUrlFromZonefile, zonefile);
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
                throw new BaseError(null, "Invalid name data for CruxDomain");
        }
        return domainRegistrationStatus;
    }
    public static getCruxUserInformationFromSubdomainStatus = (subdomainStatus: {status: string, statusCode?: number}): ICruxUserInformation =>  {
        let status: ICruxUserRegistrationStatus;
        let transactionHash: string|undefined;
        const rawStatus = subdomainStatus.status;
        log.debug(subdomainStatus);
        if (rawStatus && rawStatus.includes("Your subdomain was registered in transaction")) {
            status = {
                status: SubdomainRegistrationStatus.PENDING,
                statusDetail: SubdomainRegistrationStatusDetail.PENDING_REGISTRAR,
            };
            const regexMatch = rawStatus.match(new RegExp(".+transaction (.+) --.+"));
            if (regexMatch !== null) {
                transactionHash = regexMatch[1];
            }
        } else {
            transactionHash = undefined;
            switch (rawStatus) {
                case "Subdomain is queued for update and should be announced within the next few blocks.":
                    status = {
                        status: SubdomainRegistrationStatus.PENDING,
                        statusDetail: SubdomainRegistrationStatusDetail.PENDING_BLOCKCHAIN,
                    };
                    break;
                case "Subdomain propagated":
                    status = {
                        status: SubdomainRegistrationStatus.DONE,
                        statusDetail: SubdomainRegistrationStatusDetail.DONE,
                    };
                    break;
                default:
                    // used to handle "Subdomain not registered with this registrar" for now
                    status = {
                        status: SubdomainRegistrationStatus.NONE,
                        statusDetail: SubdomainRegistrationStatusDetail.NONE,
                    };
            }
        }
        const cruxUserInformation: ICruxUserInformation = {
            registrationStatus: status,
        };
        if (transactionHash) {
            cruxUserInformation.transactionHash = transactionHash;
        }
        return cruxUserInformation;
    }
    private cacheStorage?: StorageService;
    private bnsNodes: string[];
    private subdomainRegistrar: string;
    constructor(options: IBlockstackServiceInputOptions) {
        this.bnsNodes = options.bnsNodes;
        this.subdomainRegistrar = options.subdomainRegistrar;
        this.cacheStorage = options.cacheStorage;
    }
    public getNameDetails = async (id: CruxId|CruxDomainId, tag?: string): Promise<INameDetails> => {
        const blockstackName = CruxSpec.idTranslator.cruxToBlockstack(id).toString();
        return BlockstackService.getNameDetails(blockstackName, this.bnsNodes, tag, this.cacheStorage);
    }
    public getGaiaHub = async (id: CruxId|CruxDomainId, tag?: string): Promise<string> => {
        const nameDetails = await this.getNameDetails(id, tag);
        if (!nameDetails.zonefile) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.MissingZoneFile, id.toString());
        }
        if (!nameDetails.address) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.MissingNameOwnerAddress, id.toString());
        }
        const gaiaHub = BlockstackService.getGaiaHubFromZonefile(nameDetails.zonefile);
        return gaiaHub;
    }
    public getDomainRegistrationStatus = async (cruxDomainId: CruxDomainId): Promise<DomainRegistrationStatus> => {
        // TODO: interpret the domain registration status from blockchain/BNS node
        const nameDetails = await this.getNameDetails(cruxDomainId);
        return BlockstackService.getDomainRegistrationStatusFromNameDetails(nameDetails);
    }
    public getCruxDomainIdWithConfigKeyManager = async (keyManager: IKeyManager, contextDomainId?: CruxDomainId): Promise<CruxDomainId|undefined> => {
        const configSubdomainAddress = publicKeyToAddress(await keyManager.getPubKey());
        const registeredBlockstackIDs = await BlockstackService.getRegisteredBlockstackNamesByAddress(configSubdomainAddress, this.bnsNodes, this.cacheStorage);
        const registeredDomainStringArray = registeredBlockstackIDs
            .map((blockstackID: string) => blockstackID.match(new RegExp("^_config.(.+)_crux.id$")))
            .map((match) => match && match[1])
            .filter(Boolean) as string[];
        // TODO: handle else case
        if (contextDomainId && registeredDomainStringArray.includes(contextDomainId.components.domain)) {
            return contextDomainId;
        } else if (registeredDomainStringArray.length === 1) {
            return new CruxDomainId(registeredDomainStringArray[0]);
        }
    }
    public getCruxIdWithKeyManager = async (keyManager: IKeyManager, cruxDomainId: CruxDomainId): Promise<CruxId|undefined> => {
        const userSubdomainOwnerAddress = publicKeyToAddress(await keyManager.getPubKey());
        const registeredBlockstackNames = await BlockstackService.getRegisteredBlockstackNamesByAddress(userSubdomainOwnerAddress, this.bnsNodes, this.cacheStorage);
        const registeredIdNames = registeredBlockstackNames
            // tslint:disable-next-line: tsr-detect-non-literal-regexp
            .map((blockstackName: string) => blockstackName.match(new RegExp(`(.+)\.${CruxSpec.idTranslator.cruxToBlockstack(cruxDomainId).toString()}`)))
            .map((match) => match && match[0])
            .filter(Boolean) as string[];
        if (registeredIdNames.length > 1) {
            log.error(`More than one cruxIDs associated with: ${userSubdomainOwnerAddress}`);
        }
        if (registeredIdNames[0]) {
            return CruxSpec.idTranslator.blockstackToCrux(BlockstackId.fromString(registeredIdNames[0])) as CruxId;
        }
        // Fetch any registrar entries with the address
        const registrarApiClient = new BlockstackSubdomainRegistrarApiClient(this.subdomainRegistrar, CruxSpec.idTranslator.cruxToBlockstack(cruxDomainId));
        const subdomainRegistrarEntries = await registrarApiClient.getSubdomainRegistrarEntriesByAddress(userSubdomainOwnerAddress);
        if (subdomainRegistrarEntries.length !== 0) {
            return new CruxId({
                domain: cruxDomainId.components.domain,
                subdomain: subdomainRegistrarEntries[0].subdomainName,
            });
        }
        return;
    }
    public isCruxIdAvailable = async (cruxId: CruxId): Promise<boolean> => {
        CruxSpec.validations.validateSubdomainString(cruxId.components.subdomain);
        const blockstackId = CruxSpec.idTranslator.cruxToBlockstack(cruxId);
        const registrarApiClient = new BlockstackSubdomainRegistrarApiClient(this.subdomainRegistrar, new BlockstackDomainId(blockstackId.components.domain));
        const registrarStatus = await registrarApiClient.getSubdomainStatus(cruxId.components.subdomain);
        const cruxUserInformation = BlockstackService.getCruxUserInformationFromSubdomainStatus(registrarStatus);
        return cruxUserInformation.registrationStatus.status === SubdomainRegistrationStatus.NONE;
    }
    public registerCruxId = async (cruxId: CruxId, gaiaHub: string, keyManager: IKeyManager): Promise<ICruxUserInformation> => {
        if (!keyManager) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.CouldNotFindKeyPairToRegisterName);
        }
        if (!(await this.isCruxIdAvailable(cruxId))) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.CruxIDUnavailable, cruxId);
        }
        const blockstackId = CruxSpec.idTranslator.cruxToBlockstack(cruxId);
        const registrarApiClient = new BlockstackSubdomainRegistrarApiClient(this.subdomainRegistrar, new BlockstackDomainId(blockstackId.components.domain));
        await registrarApiClient.registerSubdomain(cruxId.components.subdomain, gaiaHub, publicKeyToAddress(await keyManager.getPubKey()));
        return this.getCruxIdInformation(cruxId);
    }
    public getCruxIdInformation = async (cruxId: CruxId, tag?: string, onlyRegistered?: boolean): Promise<ICruxUserInformation> => {
        const nameDetails = await this.getNameDetails(cruxId, tag);
        let status: SubdomainRegistrationStatus;
        let statusDetail: SubdomainRegistrationStatusDetail;
        let transactionHash: string|undefined;
        let ownerAddress: string|undefined;
        if (nameDetails.status === "registered_subdomain") {
            status = SubdomainRegistrationStatus.DONE;
            statusDetail = SubdomainRegistrationStatusDetail.DONE;
            transactionHash = nameDetails.last_txid;
            ownerAddress = nameDetails.address;
            return {
                ownerAddress,
                registrationStatus: {
                    status,
                    statusDetail,
                },
                transactionHash,
            };
        }
        if (onlyRegistered) {
            return {
                registrationStatus: {
                    status: SubdomainRegistrationStatus.NONE,
                    statusDetail: SubdomainRegistrationStatusDetail.NONE,
                },
            };
        }
        const blockstackId = CruxSpec.idTranslator.cruxToBlockstack(cruxId);
        const registrarApiClient = new BlockstackSubdomainRegistrarApiClient(this.subdomainRegistrar, new BlockstackDomainId(blockstackId.components.domain));
        const registrarStatus = await registrarApiClient.getSubdomainStatus(cruxId.components.subdomain);
        const registrationStatus = BlockstackService.getCruxUserInformationFromSubdomainStatus(registrarStatus);
        return registrationStatus;
    }
}
