import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {getIdClaimForUser, getValidCruxUser, getValidCruxUser2, patchMissingDependencies} from "../test-utils";
import {InMemoryCruxGatewayRepository} from "./inmemory-infrastructure";

chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;

patchMissingDependencies();

describe('CRUX Gateway Entity Tests', function() {

    beforeEach(function() {
        this.inmemoryGatewayRepo = new InMemoryCruxGatewayRepository();

        this.user1 = getValidCruxUser();
        this.user2 = getValidCruxUser2();

        this.user1IDClaim = getIdClaimForUser(this.user1);
        this.user2IDClaim = getIdClaimForUser(this.user2)

    });

    it("Gateway without selfIdClaim cannot listen", function(done) {
    });
    describe('BASIC Protocol send receive', function() {

        beforeEach(function() {
            this.user1Gateway = this.inmemoryGatewayRepo.openGateway('BASIC');
            this.user2Gateway = this.inmemoryGatewayRepo.openGateway('BASIC');
        });
        it('Test string send receive', function(done) {

            const testmsg = "TESTING123";

            this.user2Gateway.listen((msg: any, md: any)=>{
                expect(msg).equals(testmsg);
                expect(md.senderCertificate.claim).equals(this.user1.cruxID.toString());
                done()
            });
            this.user1Gateway.sendMessage(this.user2.cruxID, testmsg);
        });
        it('Test object send receive', function(done) {

            const testmsg = {foo:'bar'};

            this.user2Gateway.listen((msg: any, md: any)=>{
                expect(msg.foo).equals(testmsg.foo);
                expect(md.senderCertificate.claim).equals(this.user1.cruxID.toString());
                done()
            });
            this.user1Gateway.sendMessage(this.user2.cruxID, testmsg);
        });
    });
});
