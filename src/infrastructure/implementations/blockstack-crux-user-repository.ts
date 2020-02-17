import { publicKeyToAddress } from "blockstack";
import {CruxDomain} from "../../core/entities/crux-domain";
import { CruxSpec } from "../../core/entities/crux-spec";
import { CruxUser, IAddressMapping, ICruxUserConfiguration, ICruxUserData, ICruxUserInformation, ICruxUserPrivateAddresses, SubdomainRegistrationStatus } from "../../core/entities/crux-user";
import { ICruxBlockstackInfrastructure } from "../../core/interfaces";
import {ICruxUserRepository, ICruxUserRepositoryOptions} from "../../core/interfaces/crux-user-repository";
import { IKeyManager } from "../../core/interfaces/key-manager";
import { BaseError, ErrorHelper, PackageError, PackageErrorCode } from "../../packages/error";
import { CruxDomainId, CruxId } from "../../packages/identity-utils";
import { getLogger } from "../../packages/logger";
import { StorageService } from "../../packages/storage";
import { cloneValue } from "../../packages/utils";
import { BlockstackService } from "../services/blockstack-service";
import { GaiaService } from "../services/gaia-service";
import { BlockstackCruxDomainRepository } from "./blockstack-crux-domain-repository";
const log = getLogger(__filename);

export interface ICruxpayObject {
    "__userData__"?: ICruxUserData;
    [assetId: string]: string|ICruxUserData|undefined;
}

export interface ICruxpayObjectAndPubKey {
    "cruxpayObject": ICruxpayObject;
    "pubKey": string;
}

export interface IBlockstackCruxUserRepositoryOptions extends ICruxUserRepositoryOptions {
    blockstackInfrastructure: ICruxBlockstackInfrastructure;
    cacheStorage?: StorageService;
}

export class BlockstackCruxUserRepository implements ICruxUserRepository {
    private cacheStorage?: StorageService;
    private infrastructure: ICruxBlockstackInfrastructure;
    private blockstackService: BlockstackService;
    private cruxDomain?: CruxDomain;
    constructor(options: IBlockstackCruxUserRepositoryOptions) {
        this.cacheStorage = options && options.cacheStorage;
        const infrastructure = options.blockstackInfrastructure;
        if (options.cruxDomain) {
            this.cruxDomain = options.cruxDomain;
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
    public create = async (cruxIdSubdomain: string, keyManager: IKeyManager): Promise<CruxUser> => {
        // Publishing an empty addressMap while registering the name to be fail safe
        const cruxUserData: ICruxUserData = {
            configuration: {enabledAssetGroups: []},
            privateAddresses: {},
        };
        await this.putCruxpayObject(this.getCruxDomain().id, {}, keyManager);
        const cruxUserInformation = await this.blockstackService.registerCruxId(this.getCruxIdFromSubdomain(cruxIdSubdomain), this.infrastructure.gaiaHub, keyManager);
        return new CruxUser(cruxIdSubdomain, this.getCruxDomain(), {}, cruxUserInformation, cruxUserData);
    }
    public isCruxIdAvailable = async (cruxIdSubdomain: string): Promise<boolean> => {
        return this.blockstackService.isCruxIdAvailable(this.getCruxIdFromSubdomain(cruxIdSubdomain));
    }
    public getByCruxId = async (cruxID: CruxId, tag?: string, onlyRegistered: boolean = false): Promise<CruxUser|undefined> => {
        const cruxUserInformation = await this.blockstackService.getCruxIdInformation(cruxID, onlyRegistered);
        if (cruxUserInformation.registrationStatus.status === SubdomainRegistrationStatus.NONE) {
            return;
        }
        let addressMap = {};
        let cruxUserData: ICruxUserData = {
            configuration: {
                enabledAssetGroups: [],
            },
            privateAddresses: {},
        };
        let cruxpayPubKey;
        if (cruxUserInformation.registrationStatus.status === SubdomainRegistrationStatus.DONE) {
            const cruxpayJson = await this.getCruxpayObjectAndPubKey(cruxID, tag);
            const cruxpayObject: ICruxpayObject = cruxpayJson.cruxpayObject;
            cruxpayPubKey = cruxpayJson.pubKey;
            const dereferencedCruxpayObject = this.dereferenceCruxpayObject(cruxpayObject);
            addressMap = dereferencedCruxpayObject.addressMap;
            if (dereferencedCruxpayObject.cruxUserData) {
                cruxUserData = dereferencedCruxpayObject.cruxUserData;
            }
        }
        return new CruxUser(cruxID.components.subdomain, await this.getUserCruxDomain(cruxID) as CruxDomain, addressMap, cruxUserInformation, cruxUserData, cruxpayPubKey);
    }
    public getWithKey = async (keyManager: IKeyManager): Promise<CruxUser|undefined> => {
        const cruxID = await this.blockstackService.getCruxIdWithKeyManager(keyManager, this.getCruxDomain().id);
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
                enabledAssetGroups: [],
            },
            privateAddresses: {},
        };
        let cruxpayPubKey = await keyManager.getPubKey();
        if (cruxUserInformation.registrationStatus.status === SubdomainRegistrationStatus.DONE) {
            const cruxpayJson = await this.getCruxpayObjectAndPubKey(cruxID);
            const cruxpayObject: ICruxpayObject = cruxpayJson.cruxpayObject;
            cruxpayPubKey = cruxpayJson.pubKey;
            const dereferencedCruxpayObject = this.dereferenceCruxpayObject(cruxpayObject);
            addressMap = dereferencedCruxpayObject.addressMap;
            if (dereferencedCruxpayObject.cruxUserData) {
                cruxUserData = dereferencedCruxpayObject.cruxUserData;
            }
        } else if (cruxUserInformation.registrationStatus.status === SubdomainRegistrationStatus.PENDING) {
            const cruxpayJson = await this.getCruxpayObjectAndPubKey(cruxID, undefined, publicKeyToAddress(await keyManager.getPubKey()));
            const cruxpayObject: ICruxpayObject = cruxpayJson.cruxpayObject;
            cruxpayPubKey = cruxpayJson.pubKey;
            const dereferencedCruxpayObject = this.dereferenceCruxpayObject(cruxpayObject);
            addressMap = dereferencedCruxpayObject.addressMap;
            if (dereferencedCruxpayObject.cruxUserData) {
                cruxUserData = dereferencedCruxpayObject.cruxUserData;
            }
        }
        return new CruxUser(cruxID.components.subdomain, this.getCruxDomain(), addressMap, cruxUserInformation, cruxUserData, cruxpayPubKey);
    }
    public save = async (cruxUser: CruxUser, keyManager: IKeyManager): Promise<CruxUser> => {
        const cruxpayObject = this.constructCruxpayObject(cruxUser.getAddressMap(), cruxUser.info, cruxUser.config, cruxUser.privateAddresses);
        await this.putCruxpayObject(cruxUser.domain.id, cruxpayObject, keyManager);
        return cruxUser;
    }
    private getCruxDomain = (): CruxDomain => {
        if (!this.cruxDomain) {
            throw new BaseError(null, "Repository requires domain context");
        }
        return this.cruxDomain;
    }
    private getCruxIdFromSubdomain = (subdomain: string) => {
        return new CruxId({
            domain: this.getCruxDomain().id.components.domain,
            subdomain,
        });
    }
    private getUserCruxDomain = (cruxId: CruxId): Promise<CruxDomain|undefined> => {
        return new BlockstackCruxDomainRepository({cacheStorage: this.cacheStorage, blockstackInfrastructure: this.infrastructure}).get(new CruxDomainId(cruxId.components.domain));
    }
    private getCruxpayObjectAndPubKey = async (cruxId: CruxId, tag?: string, ownerAddress?: string): Promise<ICruxpayObjectAndPubKey> => {
        const cruxPayFileName = CruxSpec.blockstack.getCruxPayFilename(new CruxDomainId(cruxId.components.domain));
        const cruxpay = await this.getContentByFilename(cruxId, cruxPayFileName, tag, ownerAddress);
        return {
            cruxpayObject: cruxpay.payload.claim,
            pubKey: cruxpay.payload.subject.publicKey,
        };
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
    private constructCruxpayObject = (addressMap: IAddressMapping, userInformation: ICruxUserInformation, userConfiguration: ICruxUserConfiguration, privateAddresses: ICruxUserPrivateAddresses): ICruxpayObject => {
        const cruxpayObject: ICruxpayObject = cloneValue(addressMap);
        cruxpayObject.__userData__ = {
            configuration: userConfiguration,
            privateAddresses,
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
