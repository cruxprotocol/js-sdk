import { GaiaCruxUserRepository } from "../../packages/payment/infrastructure/repositories/cruxuser";
import { CruxUserRepository } from "../../packages/payment/model/cruxuser/repository";
import { IUserID } from "../../packages/payment/shared-kernel/interfaces";
import { CruxUser } from "../../packages/payment/model/cruxuser/aggregate";
var assert = require('chai').assert

describe("GaiaCruxUserRepository tests", () => {

    let repository: CruxUserRepository

    beforeEach(() => {
        repository =  new GaiaCruxUserRepository("https://hub.cruxpay.com")
    });

    it("getCruxUser valid case", async () => {
        let cruxUserId: IUserID = {domain: 'cruxdev', subdomain: 'shreedhar008'}
        let cruxUser = await repository.getCruxUser(cruxUserId);
        assert.instanceOf(cruxUser, CruxUser);
    })
})