import { CruxSpec } from "../../core/entities/crux-spec";
import { CruxUser } from "../../core/entities/crux-user";
import { ICruxBlockstackInfrastructure } from "../../core/interfaces";
import { ICruxUserRepository } from "../../core/interfaces/crux-user-repository";
import { BlockstackCruxUserRepository } from "../../infrastructure/implementations/blockstack-crux-user-repository";
import { CruxId } from "../../packages/identity-utils";
import { InMemStorage } from "../../packages/inmem-storage";

export class CruxExplorerClient {
    private cruxBlockstackInfrastructure: ICruxBlockstackInfrastructure;
    private cruxUserRepository: ICruxUserRepository;
    constructor() {
        const cacheStorage = new InMemStorage();
        this.cruxBlockstackInfrastructure = CruxSpec.blockstack.infrastructure;
        this.cruxUserRepository = new BlockstackCruxUserRepository({cacheStorage, blockstackInfrastructure: this.cruxBlockstackInfrastructure});
    }
    public getCruxUserById = async (cruxIdString: string): Promise<CruxUser|undefined> => {
        const cruxId = CruxId.fromString(cruxIdString);
        return this.cruxUserRepository.getByCruxId(cruxId);
    }
}
