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
            const user1GatewayForUser2 = this.inmemoryGatewayRepo.get({selfIdClaim: this.user1IDClaim, receiverId: this.user2.cruxID});
            const user2SelfGateway = this.inmemoryGatewayRepo.get({selfIdClaim: this.user2IDClaim});
            user2SelfGateway.listen((msg: any, md: any)=>{
                expect(msg).equals(testmsg);
                expect(md.senderCertificate.claim).equals(this.user1.cruxID.toString());
            });
            user1GatewayForUser2.sendMessage(testmsg); // discuss await scenario
        });

        it('Test Certificate Creation', async function() {
                    
            const testCeritficate = {
                claim: this.user1.cruxID.toString(),
                messageId : "123e4567-e89b-12d3-a456-426614174000"
            };
            const certificate = await CertificateManager.make(this.user1IDClaim,"123e4567-e89b-12d3-a456-426614174000");
            expect(certificate.claim).to.equals(testCeritficate.claim);
            expect(certificate.messageId).to.equals(testCeritficate.messageId);
        });

        it('Test Certificate Creation with wrong messageId', async function() {
                    
            const testCeritficate = {
                claim: this.user1.cruxID.toString(),
                messageId : "223e4567-e89b-12d3-a456-426614174000"
            };
            const certificate = await CertificateManager.make(this.user1IDClaim,"123e4567-e89b-12d3-a456-426614174000");
            expect(certificate.claim).to.equals(testCeritficate.claim);
            expect(certificate.messageId).to.not.equals(testCeritficate.messageId);
        });

        it('Test Certificate Creation with wrong claim', async function() {
                    
            const testCeritficate = {
                claim: this.user2.cruxID.toString(),
                messageId : "123e4567-e89b-12d3-a456-426614174000"
            };
            const certificate = await CertificateManager.make(this.user1IDClaim,"123e4567-e89b-12d3-a456-426614174000");
            expect(certificate.claim).to.not.equals(testCeritficate.claim);
            expect(certificate.messageId).to.equals(testCeritficate.messageId);
        });

        it('Test Certificate Verification', async function() {
                    
            const testValidation = true;
            const messageId = "123e4567-e89b-12d3-a456-426614174000";
            const certificate = await CertificateManager.make(this.user1IDClaim, messageId);
            const validation = CertificateManager.verify(this.user1IDClaim, certificate);
            expect(validation).to.equals(testValidation);
        });

        it('Test Certificate Verification without idclaim', async function() {
                    
            const testValidation = false;
            const messageId = "123e4567-e89b-12d3-a456-42661417000";
            const certificate = await CertificateManager.make(this.user1IDClaim, messageId);
            const validation = CertificateManager.verify(undefined, certificate);
            expect(validation).to.equals(testValidation);
        });

        it('Test Certificate Verification with wrong ID claim', async function() {
                    
            const testValidation = false;
            const messageId = "123e4567-e89b-12d3-a456-42661417000";
            const certificate = await CertificateManager.make(this.user1IDClaim, messageId);
            const validation = CertificateManager.verify(this.user2IDClaim, certificate);
            expect(validation).to.equals(testValidation);
        });
        // TODO: Test Certificate validation failed
        // TODO: Allow Only Certified Messages
        // TODO: Encrypted Messages only
    });
});
