import { publicKeyToAddress } from "blockstack";
import { IAddressMapping } from "../..";
import config from "../../config";
import { DomainRegistrationStatus } from "../../core/entities/crux-domain";
import { CruxSpec } from "../../core/entities/crux-spec";
import { ICruxBlockstackInfrastructure } from "../../core/interfaces";
import { IKeyManager } from "../../core/interfaces/key-manager";
import { IClientConfig } from "../../packages/configuration-service";
import { ErrorHelper, PackageErrorCode } from "../../packages/error";
import { getContentFromGaiaHub, getGaiaDataFromBlockstackID } from "../../packages/gaia-service/utils";
import { BlockstackId, CruxDomainId, IdTranslator } from "../../packages/identity-utils";
import { getLogger } from "../../packages/logger";
import { fetchNameDetails, INameDetailsObject } from "../../packages/name-service/utils";
import { httpJSONRequest } from "../../packages/utils";
import { GaiaService } from "./gaia-service";
const log = getLogger(__filename);
export class BlockstackService {
    public static infrastructure: ICruxBlockstackInfrastructure = {
        bnsNodes: config.BLOCKSTACK.BNS_NODES,
        gaiaHub: config.BLOCKSTACK.GAIA_HUB,
    };
    public static getDomainRegistrationStatus = async (domain: string, bnsNodes: string[]): Promise<DomainRegistrationStatus> => {
        // TODO: interpret the domain registration status from blockchain/BNS node
        const domainBlockstackID = CruxSpec.idTranslator.cruxDomainStringToBlockstackDomainString(domain);
        const nameDetails = await fetchNameDetails(domainBlockstackID, bnsNodes);
        if (!nameDetails) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.BnsResolutionFailed);
        }
        return BlockstackService.getDomainRegistrationStatusFromNameDetails(nameDetails);
    }
    public static getRegisteredIDsByAddress = async (address: string, bnsNodes: string[]): Promise<string[]> => {
        const nodePromises = bnsNodes.map((baseUrl) => BlockstackService.fetchIDsByAddress(baseUrl, address));
        const responseArr: string[][] = await Promise.all(nodePromises);
        const commonIDs = [...(responseArr.map((arr) => new Set(arr)).reduce((a, b) => new Set([...a].filter((x) => b.has(x)))))];
        return commonIDs;
    }
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
    public static getClientConfig = async (domain: string, bnsNodes: string[]): Promise<IClientConfig> => {
        const configBlockstackID = CruxSpec.blockstack.getConfigBlockstackID(domain);
        const domainConfigFileName = CruxSpec.blockstack.getDomainConfigFileName(domain);
        return getContentFromGaiaHub(configBlockstackID, domainConfigFileName, bnsNodes);
    }
    public static putClientConfig = async (domain: string, clientConfig: IClientConfig, bnsNodes: string[], keyManager: IKeyManager): Promise<string> => {
        const configBlockstackID = CruxSpec.blockstack.getConfigBlockstackID(domain);
        const domainConfigFileName = CruxSpec.blockstack.getDomainConfigFileName(domain);
        const gaiaDetails = await getGaiaDataFromBlockstackID(configBlockstackID, bnsNodes);
        const finalURL = await new GaiaService(gaiaDetails.gaiaWriteUrl).uploadContentToGaiaHub(domainConfigFileName, clientConfig, keyManager);
        log.info(`clientConfig saved to: ${finalURL}`);
        return finalURL;
    }
    public static restoreDomain = async (keyManager: IKeyManager, bnsNodes: string[], domainContext?: string): Promise<string|undefined> => {
        const configSubdomainAddress = publicKeyToAddress(await keyManager.getPubKey());
        const registeredBlockstackIDs = await BlockstackService.getRegisteredIDsByAddress(configSubdomainAddress, bnsNodes);
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
    public static getAddressMap = async (blockstackID: BlockstackId, bnsNodes: string[]): Promise<IAddressMapping> => {
        const cruxPayFileName = CruxSpec.blockstack.getCruxPayFilename(blockstackID);
        return getContentFromGaiaHub(blockstackID.toString(), cruxPayFileName, bnsNodes);
    }
    public static getBlockstackIdFromKeyManager = async (keyManager: IKeyManager, walletClientName: string, bnsNodes: string[]): Promise<BlockstackId|undefined> => {
        const userSubdomainOwnerAddress = publicKeyToAddress(await keyManager.getPubKey());
        const registeredBlockstackIDs = await BlockstackService.getRegisteredIDsByAddress(userSubdomainOwnerAddress, bnsNodes);
        const registeredDomainArray = registeredBlockstackIDs
            .map((blockstackID: string) => blockstackID.match(new RegExp(`(.+)\.${IdTranslator.cruxToBlockstack(new CruxDomainId(walletClientName)).toString()}`)))
            .map((match) => match && match[0])
            .filter((domain) => domain !== undefined) as string[];
        if (registeredDomainArray.length > 1) {
            log.error(`More than one cruxIDs associated with: ${userSubdomainOwnerAddress}`);
        }
        return registeredDomainArray[0] ? BlockstackId.fromString(registeredDomainArray[0]) : undefined;
        // return registeredDomainArray[0];
    }
}
