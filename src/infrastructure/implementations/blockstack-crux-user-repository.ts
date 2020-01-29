import { publicKeyToAddress } from "blockstack";
import {CruxDomain} from "../../core/entities/crux-domain";
import { CruxSpec } from "../../core/entities/crux-spec";
import { CruxUser, IAddressMapping, ICruxUserConfiguration, SubdomainRegistrationStatus } from "../../core/entities/crux-user";
import { ICruxBlockstackInfrastructure } from "../../core/interfaces";
import {ICruxUserRepository, ICruxUserRepositoryOptions} from "../../core/interfaces/crux-user-repository";
import { IKeyManager } from "../../core/interfaces/key-manager";
import { ErrorHelper, PackageErrorCode } from "../../packages/error";
import { CruxDomainId, CruxId } from "../../packages/identity-utils";
import { getLogger } from "../../packages/logger";
import { StorageService } from "../../packages/storage";
import { BlockstackService } from "../services/blockstack-service";
import { GaiaService } from "../services/gaia-service";
const log = getLogger(__filename);

export interface IBlockstackCruxUserRepositoryOptions extends ICruxUserRepositoryOptions {
    blockstackInfrastructure: ICruxBlockstackInfrastructure;
    cacheStorage?: StorageService;
    cruxDomain?: CruxDomain;
}

export class BlockstackCruxUserRepository implements ICruxUserRepository {
    private cacheStorage?: StorageService;
    private infrastructure: ICruxBlockstackInfrastructure;
    private blockstackService: BlockstackService;
    constructor(options: IBlockstackCruxUserRepositoryOptions) {
        this.cacheStorage = options && options.cacheStorage;
        const infrastructure = options.blockstackInfrastructure;
        if (options.cruxDomain) {
            const domainBnsOverrides = options.cruxDomain.config.nameserviceConfiguration ? options.cruxDomain.config.nameserviceConfiguration.bnsNodes : undefined;
            infrastructure.bnsNodes = domainBnsOverrides && [...new Set([...infrastructure.bnsNodes, ...domainBnsOverrides])] || infrastructure.bnsNodes;
            const gaiaHubOverride = options.cruxDomain.config.nameserviceConfiguration ? options.cruxDomain.config.nameserviceConfiguration.gaiaHub : undefined;
            infrastructure.gaiaHub = gaiaHubOverride || infrastructure.gaiaHub;
            const subdomainRegistrarOverride = options.cruxDomain.config.nameserviceConfiguration ? options.cruxDomain.config.nameserviceConfiguration.subdomainRegistrar : undefined;
            infrastructure.subdomainRegistrar = subdomainRegistrarOverride || infrastructure.subdomainRegistrar;
        }
        this.infrastructure = infrastructure;
        this.blockstackService = new BlockstackService({
            bnsNodes: this.infrastructure.bnsNodes,
            cacheStorage: this.cacheStorage,
            subdomainRegistrar: this.infrastructure.subdomainRegistrar,
        });
        log.debug("BlockstackCruxUserRepository initialised");
    }
    public create = async (cruxId: CruxId, keyManager: IKeyManager): Promise<CruxUser> => {
        const cruxUserInformation = await this.blockstackService.registerCruxId(cruxId, this.infrastructure.gaiaHub, keyManager);
        return new CruxUser(cruxId, {}, cruxUserInformation, {enabledParentAssetFallbacks: []});
    }
    public isCruxIdAvailable = async (cruxID: CruxId): Promise<boolean> => {
        return this.blockstackService.isCruxIdAvailable(cruxID);
    }
    public getByCruxId = async (cruxID: CruxId, tag?: string): Promise<CruxUser|undefined> => {
        const cruxUserInformation = await this.blockstackService.getCruxIdInformation(cruxID);
        if (cruxUserInformation.registrationStatus.status === SubdomainRegistrationStatus.NONE) {
            return;
        }
        let addressMap = {};
        let userConfiguration: ICruxUserConfiguration = {
            enabledParentAssetFallbacks: [],
        };
        if (cruxUserInformation.registrationStatus.status === SubdomainRegistrationStatus.DONE) {
            addressMap = await this.getAddressMap(cruxID, tag);
            userConfiguration = await this.getUserConfiguration(cruxID, tag);
        }
        return new CruxUser(cruxID, addressMap, cruxUserInformation, userConfiguration);
    }
    public getWithKey = async (keyManager: IKeyManager, cruxDomainId: CruxDomainId): Promise<CruxUser|undefined> => {
        const cruxID = await this.blockstackService.getCruxIdWithKeyManager(keyManager, cruxDomainId);
        if (!cruxID) {
            return;
        }
        const cruxUserInformation = await this.blockstackService.getCruxIdInformation(cruxID);
        if (cruxUserInformation.registrationStatus.status === SubdomainRegistrationStatus.NONE) {
            return;
        }
        let addressMap = {};
        let userConfiguration: ICruxUserConfiguration = {
            enabledParentAssetFallbacks: [],
        };
        if (cruxUserInformation.registrationStatus.status === SubdomainRegistrationStatus.DONE) {
            addressMap = await this.getAddressMap(cruxID);
            userConfiguration = await this.getUserConfiguration(cruxID);
        } else if (cruxUserInformation.registrationStatus.status === SubdomainRegistrationStatus.PENDING) {
            addressMap = await this.getAddressMap(cruxID, undefined, publicKeyToAddress(await keyManager.getPubKey()));
            userConfiguration = await this.getUserConfiguration(cruxID, undefined, publicKeyToAddress(await keyManager.getPubKey()));
        }
        return new CruxUser(cruxID, addressMap, cruxUserInformation, userConfiguration);
    }
    public save = async (cruxUser: CruxUser, keyManager: IKeyManager): Promise<CruxUser> => {
        await this.putAddressMap(cruxUser.cruxID, cruxUser.getAddressMap(), keyManager);
        await this.putUserConfiguration(cruxUser.cruxID, cruxUser.config, keyManager);
        return cruxUser;
    }
    private getAddressMap = async (cruxId: CruxId, tag?: string, ownerAddress?: string): Promise<IAddressMapping> => {
        const cruxPayFileName = CruxSpec.blockstack.getCruxPayFilename(cruxId);
        return this.getContentByFilename(cruxId, cruxPayFileName, tag, ownerAddress);
    }
    private putAddressMap = async (cruxId: CruxId, addressMap: IAddressMapping, keyManager: IKeyManager): Promise<string> => {
        const cruxPayFileName = CruxSpec.blockstack.getCruxPayFilename(cruxId);
        const url = await this.putContentByFilename(cruxId, cruxPayFileName, addressMap, keyManager);
        log.debug(`Address Map for ${cruxId} saved to: ${url}`);
        return url;
    }
    private getUserConfiguration = async (cruxId: CruxId, tag?: string, ownerAddress?: string) => {
        const cruxUserConfigFileName = CruxSpec.blockstack.getCruxUserConfigFileName(cruxId);
        const userConfiguration = await this.getContentByFilename(cruxId, cruxUserConfigFileName, tag, ownerAddress);
        return userConfiguration;
    }
    private putUserConfiguration = async (cruxId: CruxId, cruxUserConfiguration: ICruxUserConfiguration, keyManager: IKeyManager): Promise<string> => {
        const cruxUserConfigFileName = CruxSpec.blockstack.getCruxUserConfigFileName(cruxId);
        const url = await this.putContentByFilename(cruxId, cruxUserConfigFileName, cruxUserConfiguration, keyManager);
        log.debug(`User Config for ${cruxId} saved to: ${url}`);
        return url;
    }
    private getContentByFilename = async (cruxId: CruxId, filename: string, tag?: string, ownerAddress?: string) => {
        let gaiaHub = await this.blockstackService.getGaiaHub(cruxId, tag);
        if (!gaiaHub) {
            gaiaHub = this.infrastructure.gaiaHub;
        }
        if (!ownerAddress) {
            const nameDetails = await this.blockstackService.getNameDetails(cruxId, tag);
            if (!nameDetails.address) {
                throw ErrorHelper.getPackageError(null, PackageErrorCode.MissingNameOwnerAddress, cruxId.toString());
            }
            return new GaiaService(gaiaHub, this.cacheStorage).getContentFromGaiaHub(nameDetails.address, filename);
        }
        return new GaiaService(gaiaHub, this.cacheStorage).getContentFromGaiaHub(ownerAddress, filename);
    }
    private putContentByFilename = async (cruxId: CruxId, filename: string, content: any, keyManager: IKeyManager): Promise<string> => {
        let gaiaHub = await this.blockstackService.getGaiaHub(cruxId);
        if (!gaiaHub) {
            gaiaHub = this.infrastructure.gaiaHub;
        }
        const finalURL = await new GaiaService(gaiaHub, this.cacheStorage).uploadContentToGaiaHub(filename, content, keyManager);
        return finalURL;
    }
}
