import { CruxUser } from "../../packages/payment/domain/cruxuser/aggregate";
import { IUserID } from "../../packages/payment/shared-kernel/interfaces";
import { CruxUserRepository } from "../../packages/payment/domain/cruxuser/repository";
import { GaiaCruxUserRepository } from "../../packages/payment/infrastructure/repositories/cruxuser";
import { async } from "q";

describe("CruxUser domain tests", () => {
    describe("cruxUser entity tests", () => {

        let cruxUserId: IUserID;
        let cruxUserRepository: CruxUserRepository;
        let cruxUser: CruxUser;

        beforeEach( () => {
            cruxUserRepository = new GaiaCruxUserRepository("https://gaia.cruxpay.com");
            const cruxUserId: IUserID = {cruxIdentifier: "sanchay@cruxdev.crux"};
        })

        it("cruxUser sendPaymentRequest raises an integration event on the global integration eventer", async () => {
            const cruxUser: CruxUser = await cruxUserRepository.getCruxUser(cruxUserId);
        })
    })

    describe("cruxUserProfile entity tests", () => {

    })
})