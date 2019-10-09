import { IUserID } from "../../shared-kernel/interfaces";
import { UserId } from "../../shared-kernel/models";
import { CruxUser } from "./aggregate";

export abstract class CruxUserRepository {
    public abstract getCruxUser = async (userId: IUserID): Promise<CruxUser> => new CruxUser({key: "", type: "", encoding: ""}, undefined);
    public abstract updateCruxUser = async (userId: IUserID): Promise<CruxUser> => new CruxUser({key: "", type: "", encoding: ""}, undefined);
}
