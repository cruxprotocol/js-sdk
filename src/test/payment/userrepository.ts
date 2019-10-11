import { GaiaCruxUserRepository } from "../../packages/payment/infrastructure/repositories/cruxuser"
import { GaiaCruxUserProfileRepository } from "../../packages/payment/infrastructure/repositories/cruxuserrepository";
import { IUserID } from "../../packages/payment/shared-kernel/interfaces"
import { CruxUser } from "../../packages/payment/domain/cruxuser/aggregate"
import { assert } from "chai";
import { expect } from "chai";
import { CruxUserProfile } from "../../packages/payment/domain/cruxuser/cruxuserprofile";


describe("CruxUser and CruxUserProfile repository tests", () => {
    describe("gaia repository tests", () => {

        let cruxUserId: IUserID = {cruxIdentifier: "sanchay@cruxdev.crux"};
        let cruxUserProfileId: IUserID = {cruxIdentifier: "shreedhar008@cruxdev.crux"};

        let cruxUserRepository: GaiaCruxUserRepository;
        let cruxUserProfileRepository: GaiaCruxUserProfileRepository;

        beforeEach( () => {
            cruxUserRepository = new GaiaCruxUserRepository("https://gaia.cruxpay.com");
            cruxUserProfileRepository = new GaiaCruxUserProfileRepository("https://gaia.cruxpay.com")
        })

        describe("cruxUser repository tests", () => {
            it("get cruxuser from gaia using virtualAddress from payIDClaim", async () => {
                const cruxUser1: CruxUser = await cruxUserRepository.getCruxUser(cruxUserId);
                assert.instanceOf(cruxUser1, CruxUser);
                expect(cruxUser1.userId.cruxIdentifier).to.equal(cruxUserId.cruxIdentifier);
                expect(cruxUser1).to.have.property('sendPaymentRequest');
            })
        })

        describe("cruxUserProfile repository tests", () => {
            it("get curxuserprofile from gaia using virtualAddress from payIDClaim", async () => {
                const cruxUser1: CruxUserProfile = await cruxUserProfileRepository.getCruxUserProfile(cruxUserProfileId);
                assert.instanceOf(cruxUser1, CruxUserProfile);
                expect(cruxUser1.userId.cruxIdentifier).to.equal(cruxUserProfileId.cruxIdentifier);
            })
        })

    })
})