import { publicKeyToAddress } from "blockstack";
import {CruxDomain} from "../../core/entities/crux-domain";
import { CruxSpec } from "../../core/entities/crux-spec";
import { CruxUser, IAddressMapping, ICruxUserConfiguration, ICruxUserData, SubdomainRegistrationStatus } from "../../core/entities/crux-user";
import { ICruxBlockstackInfrastructure } from "../../core/interfaces";
import {ICruxUserRepository, ICruxUserRepositoryOptions} from "../../core/interfaces/crux-user-repository";
import { IKeyManager } from "../../core/interfaces/key-manager";
import { ErrorHelper, PackageError, PackageErrorCode } from "../../packages/error";
import { CruxDomainId, CruxId } from "../../packages/identity-utils";
import { getLogger } from "../../packages/logger";
import { StorageService } from "../../packages/storage";
import { cloneValue } from "../../packages/utils";
import { BlockstackService } from "../services/blockstack-service";
import { GaiaService } from "../services/gaia-service";
const log = getLogger(__filename);

export interface ICruxpayObject {
    "__userData__"?: ICruxUserData;
    [assetId: string]: string|ICruxUserData|undefined;
}

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
        // Publishing an empty addressMap while registering the name to be fail safe
        const cruxUserData = {
            configuration: {enabledParentAssetFallbacks: []},
        };
        await this.putCruxpayObject(new CruxDomainId(cruxId.components.domain), {}, keyManager);
        const cruxUserInformation = await this.blockstackService.registerCruxId(cruxId, this.infrastructure.gaiaHub, keyManager);
        return new CruxUser(cruxId, {}, cruxUserInformation, cruxUserData);
    }
    public isCruxIdAvailable = async (cruxID: CruxId): Promise<boolean> => {
        return this.blockstackService.isCruxIdAvailable(cruxID);
    }
    public getByCruxId = async (cruxID: CruxId, tag?: string, onlyRegistered: boolean = false): Promise<CruxUser|undefined> => {
        const cruxUserInformation = await this.blockstackService.getCruxIdInformation(cruxID, onlyRegistered);
        if (cruxUserInformation.registrationStatus.status === SubdomainRegistrationStatus.NONE) {
            return;
        }
        let addressMap = {};
        let cruxUserData: ICruxUserData = {
            configuration: {
                enabledParentAssetFallbacks: [],
            },
        };
        if (cruxUserInformation.registrationStatus.status === SubdomainRegistrationStatus.DONE) {
            const cruxpayObject: ICruxpayObject = await this.getCruxpayObject(cruxID, tag);
            const dereferencedCruxpayObject = this.dereferenceCruxpayObject(cruxpayObject);
            addressMap = dereferencedCruxpayObject.addressMap;
            if (dereferencedCruxpayObject.cruxUserData) {
                cruxUserData = dereferencedCruxpayObject.cruxUserData;
            }
        }
        return new CruxUser(cruxID, addressMap, cruxUserInformation, cruxUserData);
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
        let cruxUserData: ICruxUserData = {
            configuration: {
                enabledParentAssetFallbacks: [],
            },
        };
        if (cruxUserInformation.registrationStatus.status === SubdomainRegistrationStatus.DONE) {
            const cruxpayObject: ICruxpayObject = await this.getCruxpayObject(cruxID);
            const dereferencedCruxpayObject = this.dereferenceCruxpayObject(cruxpayObject);
            addressMap = dereferencedCruxpayObject.addressMap;
            if (dereferencedCruxpayObject.cruxUserData) {
                cruxUserData = dereferencedCruxpayObject.cruxUserData;
            }
        } else if (cruxUserInformation.registrationStatus.status === SubdomainRegistrationStatus.PENDING) {
            const cruxpayObject: ICruxpayObject = await this.getCruxpayObject(cruxID, undefined, publicKeyToAddress(await keyManager.getPubKey()));
            const dereferencedCruxpayObject = this.dereferenceCruxpayObject(cruxpayObject);
            addressMap = dereferencedCruxpayObject.addressMap;
            if (dereferencedCruxpayObject.cruxUserData) {
                cruxUserData = dereferencedCruxpayObject.cruxUserData;
            }
        }
        return new CruxUser(cruxID, addressMap, cruxUserInformation, cruxUserData);
    }
    public save = async (cruxUser: CruxUser, keyManager: IKeyManager): Promise<CruxUser> => {
        const cruxpayObject = this.constructCruxpayObject(cruxUser.getAddressMap(), cruxUser.config);
        await this.putCruxpayObject(new CruxDomainId(cruxUser.cruxID.components.domain), cruxpayObject, keyManager);
        return cruxUser;
    }
    private getCruxpayObject = async (cruxId: CruxId, tag?: string, ownerAddress?: string): Promise<ICruxpayObject> => {
        const cruxPayFileName = CruxSpec.blockstack.getCruxPayFilename(new CruxDomainId(cruxId.components.domain));
        return this.getContentByFilename(cruxId, cruxPayFileName, tag, ownerAddress);
    }
    private putCruxpayObject = async (cruxDomainId: CruxDomainId, cruxpayObject: ICruxpayObject, keyManager: IKeyManager): Promise<string> => {
        const cruxPayFileName = CruxSpec.blockstack.getCruxPayFilename(cruxDomainId);
        const url = await this.putContentByFilename(cruxDomainId, cruxPayFileName, cruxpayObject, keyManager);
        log.debug(`Address Map saved to: ${url}`);
        return url;
    }
    private getContentByFilename = async (cruxId: CruxId, filename: string, tag?: string, ownerAddress?: string) => {
        let gaiaHub: string|undefined;
        try {
            gaiaHub = await this.blockstackService.getGaiaHub(cruxId, tag);
        } catch (error) {
            if (error instanceof PackageError && [PackageErrorCode.MissingZoneFile, PackageErrorCode.MissingNameOwnerAddress].includes(error.errorCode)) {
                log.debug("missing nameDetails, assuming the id to be in pending state and moving forward with the gaia fallback");
            } else {
                throw error;
            }
        }
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
    private putContentByFilename = async (cruxDomainId: CruxDomainId, filename: string, content: any, keyManager: IKeyManager): Promise<string> => {
        const cruxId = await this.blockstackService.getCruxIdWithKeyManager(keyManager, cruxDomainId);
        let gaiaHub: string|undefined;
        if (cruxId) {
            try {
                gaiaHub = await this.blockstackService.getGaiaHub(cruxId);
            } catch (error) {
                if (error instanceof PackageError && [PackageErrorCode.MissingZoneFile, PackageErrorCode.MissingNameOwnerAddress].includes(error.errorCode)) {
                    log.debug("missing nameDetails, assuming the id to be in pending state and moving forward with the gaia fallback");
                } else {
                    throw error;
                }
            }
        }
        if (!gaiaHub) {
            gaiaHub = this.infrastructure.gaiaHub;
        }
        const finalURL = await new GaiaService(gaiaHub, this.cacheStorage).uploadContentToGaiaHub(filename, content, keyManager);
        return finalURL;
    }
    private constructCruxpayObject = (addressMap: IAddressMapping, userConfiguration: ICruxUserConfiguration): ICruxpayObject => {
        const cruxpayObject: ICruxpayObject = cloneValue(addressMap);
        cruxpayObject.__userData__ = {
            configuration: userConfiguration,
        };
        return cruxpayObject;
    }
    private dereferenceCruxpayObject = (cruxpayObject: ICruxpayObject): { addressMap: IAddressMapping, cruxUserData?: ICruxUserData } => {
        const cruxpayObjectClone: ICruxpayObject = cloneValue(cruxpayObject);
        const cruxUserData = cruxpayObjectClone.__userData__;
        // after extracting the userData from the cruxpayObject, delete the key from the property and assume the rest is valid addressMap
        delete cruxpayObjectClone.__userData__;
        const addressMap: IAddressMapping = cloneValue(cruxpayObjectClone);
        return {
            addressMap,
            cruxUserData,
        };
    }
}
