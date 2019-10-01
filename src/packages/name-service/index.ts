import { IAddressMapping } from "../..";

// NameService abstraction

export interface IIdentityClaim {
    secrets: any;
}

export abstract class NameService {
    // TODO: Make CHILD CLASS implement instead of extend
    public abstract generateIdentity = async (): Promise<IIdentityClaim> => ({ secrets: null });
    public abstract restoreIdentity = async (name: string, options?: any): Promise<IIdentityClaim> => ({ secrets: null });
    public abstract getDecryptionKey = async (identityClaim: IIdentityClaim): Promise<string> => "";
    public abstract getEncryptionKey = async (identityClaim: IIdentityClaim): Promise<string> => "";
    public abstract getNameAvailability = async (name: string): Promise<boolean> => false;
    public abstract registerName = async (identityClaim: IIdentityClaim, name: string): Promise<string> => "";
    // TODO: need to respond with boolean
    public abstract getRegistrationStatus = async (identityClaim: IIdentityClaim): Promise<CruxIDRegistrationStatus> => ({status: "", status_detail: ""});
    public abstract getAddressMapping = async (name: string, options?: JSON): Promise<IAddressMapping> => ({});
    public abstract putAddressMapping = async (identityClaim: IIdentityClaim, addressMapping: IAddressMapping): Promise<boolean> => false;
    // TODO: Implement methods to add/update address mapping (Gamma usecase)

}

export interface CruxIDRegistrationStatus {
    status: string;
    status_detail: string;
}
