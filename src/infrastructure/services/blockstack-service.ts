import { publicKeyToAddress } from "blockstack";
import { DomainRegistrationStatus } from "../../core/entities/crux-domain";
import { CruxSpec } from "../../core/entities/crux-spec";
import { ICruxBlockstackInfrastructure } from "../../core/interfaces";
import { IKeyManager } from "../../core/interfaces/key-manager";
import { IClientConfig } from "../../packages/configuration-service";
import { ErrorHelper, PackageErrorCode } from "../../packages/error";
import { getContentFromGaiaHub, getGaiaDataFromBlockstackID } from "../../packages/gaia-service/utils";
import { getLogger } from "../../packages/logger";
import { fetchNameDetails, INameDetailsObject } from "../../packages/name-service/utils";
import { StorageService } from "../../packages/storage";
import { httpJSONRequest } from "../../packages/utils";
import { GaiaService } from "./gaia-service";
const log = getLogger(__filename);
export interface IBlockstackServiceInputOptions {
    infrastructure: ICruxBlockstackInfrastructure;
    cacheStorage?: StorageService;
    bnsOverrides?: string[];
}
export class BlockstackService {
    public static fetchIDsByAddress = async (baseUrl: string, address: string): Promise<string[]> => {
        const url = `/v1/addresses/bitcoin/${address}`;
        const options = {
            baseUrl,
            json: true,
            method: "GET",
            url,
        };
        try {
            const namesData = (await httpJSONRequest(options)) as {names: string[]};
            return namesData.names;
        } catch (error) {
            throw ErrorHelper.getPackageError(error, PackageErrorCode.GetNamesByAddressFailed, `${baseUrl}${url}`, error);
        }
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
    private gaiaHub: string;
    constructor(options: IBlockstackServiceInputOptions) {
        this.bnsNodes = options.bnsOverrides && [...new Set([...options.infrastructure.bnsNodes, ...options.bnsOverrides])] || options.infrastructure.bnsNodes;
        this.gaiaHub = options.infrastructure.gaiaHub;
        this.cacheStorage = options.cacheStorage;
    }
    public getDomainRegistrationStatus = async (domain: string): Promise<DomainRegistrationStatus> => {
        // TODO: interpret the domain registration status from blockchain/BNS node
        const domainBlockstackID = CruxSpec.idTranslator.cruxDomainStringToBlockstackDomainString(domain);
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
}
