import { setCacheStorage } from "..";
import { CruxUser } from "../core/entities/crux-user";
import { ICruxUserRepository } from "../core/interfaces/crux-user-repository";
import { BlockstackCruxUserRepository } from "../infrastructure/implementations/blockstack-crux-user-repository";
import { inmemStorage } from "../packages";
import { CruxId } from "../packages/identity-utils";

export class CruxExplorerClient {
    private cruxUserRepository: ICruxUserRepository;
    constructor() {
        setCacheStorage(new inmemStorage.InMemStorage());
        this.cruxUserRepository = new BlockstackCruxUserRepository();
    }
    public getCruxUserById = async (cruxIdString: string): Promise<CruxUser|undefined> => {
        const cruxId = CruxId.fromString(cruxIdString);
        return this.cruxUserRepository.getByCruxId(cruxId);
    }
}
