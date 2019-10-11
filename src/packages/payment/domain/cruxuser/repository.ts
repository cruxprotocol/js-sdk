import { IUserID } from "../../shared-kernel/interfaces";
import { CruxUser } from "./aggregate";
import { CruxUserProfile } from "./cruxuserprofile";

export abstract class CruxUserRepository {
    public abstract async getCruxUser(userId: IUserID): Promise<CruxUser>;
    public abstract async updateCruxUser(userId: IUserID): Promise<CruxUser>;
}

export abstract class CruxUserProfileRepository {
    public abstract async getCruxUserProfile(userId: IUserID): Promise<CruxUserProfile>;
}
