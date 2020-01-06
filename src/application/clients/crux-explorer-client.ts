import { setCacheStorage } from "../..";
import { CruxSpec } from "../../core/entities/crux-spec";
import { CruxUser } from "../../core/entities/crux-user";
import { ICruxBlockstackInfrastructure } from "../../core/interfaces";
import { ICruxUserRepository } from "../../core/interfaces/crux-user-repository";
import { BlockstackCruxUserRepository } from "../../infrastructure/implementations/blockstack-crux-user-repository";
import { inmemStorage } from "../../packages";
import { CruxId } from "../../packages/identity-utils";

export class CruxExplorerClient {
    private cruxBlockstackInfrastructure: ICruxBlockstackInfrastructure;
    private cruxUserRepository: ICruxUserRepository;
    constructor() {
        setCacheStorage(new inmemStorage.InMemStorage());
        this.cruxBlockstackInfrastructure = CruxSpec.blockstack.infrastructure;
        this.cruxUserRepository = new BlockstackCruxUserRepository({blockstackInfrastructure: this.cruxBlockstackInfrastructure});
    }
    public getCruxUserById = async (cruxIdString: string): Promise<CruxUser|undefined> => {
        const cruxId = CruxId.fromString(cruxIdString);
        return this.cruxUserRepository.getByCruxId(cruxId);
    }
}
