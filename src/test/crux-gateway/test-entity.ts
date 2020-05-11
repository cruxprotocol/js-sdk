import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {ICruxGatewayRepository} from "../../core/interfaces";
import {getIdClaimForUser, getValidCruxUser, getValidCruxUser2, patchMissingDependencies} from "../test-utils";
import {InMemoryCruxGatewayRepository} from "./inmemory-infrastructure";
import {CertificateManager} from "../../core/domain-services/index";
import { assert } from 'chai';

chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;

patchMissingDependencies();

describe('CRUX Gateway Entity Tests', function() {

    beforeEach(function() {

    });

    describe('BASIC Protocol send receive', function() {

        beforeEach(function() {
            this.inmemoryGatewayRepo = new InMemoryCruxGatewayRepository();

            this.user1 = getValidCruxUser();
            this.user2 = getValidCruxUser2();

            this.user1IDClaim = getIdClaimForUser(this.user1);
            this.user2IDClaim = getIdClaimForUser(this.user2)


        });
        it('Test string send receive', async function() {

            const testmsg = "TESTING123";
            const user2GatewayForUser1 = this.inmemoryGatewayRepo.get({selfIdClaim: this.user2IDClaim, receiverId: this.user1.cruxID});
            const user2SelfGateway = this.inmemoryGatewayRepo.get({selfIdClaim: this.user2IDClaim});
            user2SelfGateway.listen((msg: any, md: any)=>{
                expect(msg).equals(testmsg);
                expect(md.senderCertificate.claim).equals(this.user2.cruxID.toString());
            });
            await user2GatewayForUser1.sendMessage(testmsg);
        });
        // TODO: Test Certificate validation failed
        // TODO: Allow Only Certified Messages
        // TODO: Encrypted Messages only
    });
});
