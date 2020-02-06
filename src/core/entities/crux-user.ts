import { Encryption } from "../../packages/encryption";
import { BaseError } from "../../packages/error";
import { CruxId } from "../../packages/identity-utils";
import { getLogger } from "../../packages/logger";
import { IKeyManager } from "../interfaces";
import { CruxSpec } from "./crux-spec";

const log = getLogger(__filename);

export interface IAddress {
    addressHash: string;
    secIdentifier?: string;
}

export interface IAddressMapping {
    [currency: string]: IAddress;
}

export interface ICruxUserRegistrationStatus {
    status: SubdomainRegistrationStatus;
    statusDetail: SubdomainRegistrationStatusDetail;
}

export interface ICruxUserInformation {
    registrationStatus: ICruxUserRegistrationStatus;
    transactionHash?: string;
    ownerAddress?: string;
}

export interface ICruxUserData {
    publicKey?: string;
    configuration: ICruxUserConfiguration;
    privateAddresses: ICruxUserPrivateAddresses;
}

export interface ICruxUserConfiguration {
    enabledParentAssetFallbacks: string[];
}

export interface ICruxUserPrivateAddresses {
    [sharedSecretHash: string]: string;
}

export enum SubdomainRegistrationStatus {
    NONE = "NONE",
    PENDING = "PENDING",
    DONE = "DONE",
    REJECT = "REJECT",
}

export enum SubdomainRegistrationStatusDetail {
    NONE = "Subdomain not registered with this registrar.",
    PENDING_REGISTRAR = "Subdomain registration pending on registrar.",
    PENDING_BLOCKCHAIN = "Subdomain registration pending on blockchain.",
    DONE = "Subdomain propagated.",
}

export class CruxUser {
    private pubKey?: string;
    private cruxUserInformation!: ICruxUserInformation;
    private cruxUserID!: CruxId;
    private addressMap!: IAddressMapping;
    private cruxUserConfig!: ICruxUserConfiguration;
    private cruxUserPrivateAddresses!: ICruxUserPrivateAddresses;

    constructor(cruxID: CruxId, addressMap: IAddressMapping, cruxUserInformation: ICruxUserInformation, cruxUserData: ICruxUserData) {
        this.setCruxUserID(cruxID);
        this.setAddressMap(addressMap);
        this.setCruxUserInformation(cruxUserInformation);
        this.setCruxUserConfig(cruxUserData.configuration);
        this.setPublicKey(cruxUserData.publicKey);
        this.setCruxUserPrivateAddresses(cruxUserData.privateAddresses);
        log.debug("CruxUser initialised");
    }
    get cruxID() {
        return this.cruxUserID;
    }
    get info() {
        return this.cruxUserInformation;
    }
    get config() {
        return this.cruxUserConfig;
    }
    get publicKey() {
        return this.pubKey;
    }
    get privateAddresses() {
        return this.cruxUserPrivateAddresses;
    }
    public setParentAssetFallbacks = (assetGroups: string[]) => {
        // TODO: validate the assetGroups provided;
        const enabledFallbacksSet = new Set(assetGroups);
        this.cruxUserConfig.enabledParentAssetFallbacks = [...enabledFallbacksSet];
    }
    public getAddressMap(): IAddressMapping {
        return this.addressMap;
    }
    public setAddressMap(addressMap: IAddressMapping) {
        try {
            CruxSpec.validations.validateAssetIdAddressMap(addressMap);
        } catch (error) {
            throw new BaseError(error, `Address Map validation failed!`);
        }
        this.addressMap = addressMap;
    }
    public setPrivateAddressMap = async (publicKey: string, addressMap: IAddressMapping, keyManager: IKeyManager): Promise<void> => {
        if (keyManager && "deriveSharedSecret" in keyManager && typeof keyManager.deriveSharedSecret === "function") {
            const sharedSecret = await keyManager.deriveSharedSecret(publicKey);
            const sharedSecretHash = Encryption.hash(sharedSecret);
            const encryptedAddressMapObject = await Encryption.encryptJSON(addressMap, sharedSecret);
            this.cruxUserPrivateAddresses[sharedSecretHash] = JSON.stringify(encryptedAddressMapObject);
        } else {
            throw new BaseError(null, "Not supported by the keyManager in use");
        }
    }
    public getAddressWithAssetId = async (assetId: string, keyManager?: IKeyManager): Promise<IAddress|undefined> => {
        let address: IAddress|undefined;
        if (this.pubKey && keyManager && "deriveSharedSecret" in keyManager && typeof keyManager.deriveSharedSecret === "function") {
            const sharedSecret = await keyManager.deriveSharedSecret(this.pubKey);
            const sharedSecretHash = Encryption.hash(sharedSecret);
            const encryptedAddressMapObject: {encBuffer: string, iv: string} = JSON.parse(this.cruxUserPrivateAddresses[sharedSecretHash]);
            if (encryptedAddressMapObject) {
                const decryptedAddressMap = await Encryption.decryptJSON(encryptedAddressMapObject.encBuffer, encryptedAddressMapObject.iv, sharedSecret) as IAddressMapping;
                address = decryptedAddressMap[assetId];
            }
        }
        if (!address) {
            address = this.addressMap[assetId];
        }
        return address;
    }
    private setCruxUserID = (cruxID: CruxId) => {
        if (cruxID instanceof CruxId) {
            this.cruxUserID = cruxID;
        } else {
            throw new BaseError(null, "Invalid CruxID");
        }
    }
    private setCruxUserInformation = (cruxUserInformation: ICruxUserInformation) => {
        // validate and set the cruxUserInformation
        if (!(Object.values(SubdomainRegistrationStatus).includes(cruxUserInformation.registrationStatus.status))) {
            throw new BaseError(null, `Subdomain registration status validation failed!`);
        }
        if (!(Object.values(SubdomainRegistrationStatusDetail).includes(cruxUserInformation.registrationStatus.statusDetail))) {
            throw new BaseError(null, `Subdomain registration status detail validation failed!`);
        }
        this.cruxUserInformation = cruxUserInformation;
    }
    private setCruxUserConfig = (cruxUserConfiguration: ICruxUserConfiguration) => {
        // TODO: validation of the configurations
        this.cruxUserConfig = cruxUserConfiguration;
    }
    private setPublicKey = (publicKey?: string) => {
        // TODO: validation of the publicKey;
        this.pubKey = publicKey;
    }
    private setCruxUserPrivateAddresses = (cruxUserPrivateAddresses: ICruxUserPrivateAddresses) => {
        // TODO: validation of the private addresses
        this.cruxUserPrivateAddresses = cruxUserPrivateAddresses;
    }
}
