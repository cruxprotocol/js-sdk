import { IAddressMapping } from "../..";
import { StorageService } from "../storage";

// NameService abstraction

export interface IIdentityClaim {
    secrets: any;
}

/* istanbul ignore next */
export abstract class NameService {
    // TODO: Make CHILD CLASS implement instead of extend
    public abstract generateIdentity = async (storage: StorageService, encryptionKey: string): Promise<IIdentityClaim> => ({ secrets: null });
    public abstract restoreIdentity = async (name: string, identityClaim: IIdentityClaim): Promise<IIdentityClaim> => ({ secrets: null });
    public abstract getNameAvailability = async (name: string): Promise<boolean> => false;
    public abstract registerName = async (identityClaim: IIdentityClaim, name: string): Promise<string> => "";
    public abstract getRegistrationStatus = async (identityClaim: IIdentityClaim): Promise<CruxIDRegistrationStatus> => ({status: "", statusDetail: ""});
    public abstract getAddressMapping = async (name: string): Promise<IAddressMapping> => ({});
    public abstract putAddressMapping = async (identityClaim: IIdentityClaim, addressMapping: IAddressMapping): Promise<boolean> => false;
}

export interface CruxIDRegistrationStatus {
    status: string;
    statusDetail: string;
}
