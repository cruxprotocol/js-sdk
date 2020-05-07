import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {CruxGateway} from "../core/entities";
import {InMemoryCruxGatewayRepository} from "./crux-gateway-utils";
import {getIdClaimForUser, getValidCruxUser, getValidCruxUser2, patchMissingDependencies} from "./test-utils";

chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;

patchMissingDependencies()
describe('CRUX Gateway Entity Tests', async function() {

    beforeEach(function() {
        this.timeout(1000)
        this.inmemoryGatewayRepo = new InMemoryCruxGatewayRepository();

        this.user1 = getValidCruxUser();
        this.user2 = getValidCruxUser2();

        this.user1IDClaim = getIdClaimForUser(this.user1);
        this.user2IDClaim = getIdClaimForUser(this.user2)

    });
    it('Test basic message send receive', function(done) {
        this.user1Gateway = this.inmemoryGatewayRepo.openGateway('BASIC', this.user1IDClaim);
        this.user2Gateway = this.inmemoryGatewayRepo.openGateway('BASIC', this.user2IDClaim);

        const testmsg = "TESTING123"

        this.user2Gateway.listen((md: any, msg: any)=>{
            expect(msg).equals(testmsg)
            done()
        });
        this.user1Gateway.sendMessage(this.user2.cruxID, testmsg);
    });
});
