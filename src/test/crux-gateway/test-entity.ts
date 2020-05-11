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

        describe('Certificate Creation', function() {

            it('Test Certificate Creation', async function() {
                        
                const testCertificate = {
                    claim: this.user2.cruxID.toString(),
                    proof: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJtZXNzYWdlSWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAifQ.SjDx_vGQuqLDXtP38nWrzlx5PKbOgUsKhbF6HOtAQVDdGw4RiieRqNQ6kVii5to-cqBYrY6gisSQ7jltWmuKIA"
                };
                const certificate = await CertificateManager.make(this.user2IDClaim,"123e4567-e89b-12d3-a456-426614174000");
                expect(certificate.claim).to.equals(testCertificate.claim);
                expect(certificate.proof).to.equals(testCertificate.proof);
            });

            it('Test Certificate Creation with wrong claim check', async function() {
                        
                const testCertificate = {
                    claim: this.user1.cruxID.toString(),
                    proof: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJtZXNzYWdlSWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAifQ.SjDx_vGQuqLDXtP38nWrzlx5PKbOgUsKhbF6HOtAQVDdGw4RiieRqNQ6kVii5to-cqBYrY6gisSQ7jltWmuKIA"
                };
                const certificate = await CertificateManager.make(this.user2IDClaim,"123e4567-e89b-12d3-a456-426614174000");
                expect(certificate.claim).to.not.equals(testCertificate.claim);
                expect(certificate.proof).to.equals(testCertificate.proof);
            });

            it('Test Certificate Creation with wrong proof check', async function() {
                        
                const testCertificate = {
                    claim: this.user2.cruxID.toString(),
                    proof: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJtZXNzYWdlSWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAifQ.iaa0Y9mPDBv8V_fVMRrJuqRyYcVvHYqbZcTGWFrDSwezJt6R7NQbHoA36fq0av51Q2LKJsQJHAwMfc-ph806fA"
                };
                const certificate = await CertificateManager.make(this.user2IDClaim,"123e4567-e89b-12d3-a456-426614174000");
                expect(certificate.claim).to.equals(testCertificate.claim);
                expect(certificate.proof).to.not.equals(testCertificate.proof);
            });

        });

        describe('Certificate Verification', function() {
            it('Test Certificate Verification', async function() {
                
                const senderPubKey = "03e6bbc79879d37473836771441a79d3d9dddfabacdac22ed315e5636ff819a318";
                const testCertificate = {
                    claim: this.user2.cruxID.toString(),
                    proof: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJtZXNzYWdlSWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAifQ.SjDx_vGQuqLDXtP38nWrzlx5PKbOgUsKhbF6HOtAQVDdGw4RiieRqNQ6kVii5to-cqBYrY6gisSQ7jltWmuKIA"
                };
                const testMessageId = "123e4567-e89b-12d3-a456-426614174000";
                const validation = CertificateManager.verify(senderPubKey, testCertificate);
                expect(validation).to.equals(testMessageId);
            });

            it('Test Certificate Verification with wrong public key', async function() {
                
                const senderPubKey = "02bc9c3f8e924b7de9212cebd0129f1be2e6c3f2904e911b30698bde77be4878b8";
                const testCertificate = {
                    claim: this.user2.cruxID.toString(),
                    proof: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJtZXNzYWdlSWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAifQ.SjDx_vGQuqLDXtP38nWrzlx5PKbOgUsKhbF6HOtAQVDdGw4RiieRqNQ6kVii5to-cqBYrY6gisSQ7jltWmuKIA"
                };
                const testMessageId = "Could not verify sender certificate";
                const validation = CertificateManager.verify(senderPubKey, testCertificate);
                expect(validation).to.equals(testMessageId);
            });

            it('Test Certificate Verification with wrong proof', async function() {
                
                const senderPubKey = "03e6bbc79879d37473836771441a79d3d9dddfabacdac22ed315e5636ff819a318";
                const testCertificate = {
                    claim: this.user2.cruxID.toString(),
                    proof: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJtZXNzYWdlSWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAifQ.iaa0Y9mPDBv8V_fVMRrJuqRyYcVvHYqbZcTGWFrDSwezJt6R7NQbHoA36fq0av51Q2LKJsQJHAwMfc-ph806fA"
                };
                const testMessageId = "Could not verify sender certificate";
                const validation = CertificateManager.verify(senderPubKey, testCertificate);
                expect(validation).to.equals(testMessageId);
            });
        });

        describe('Certificate Creation and Verification', function() {

            it('Test Certificate Creation and Verification', async function() {
                
                const senderPubKey = "03e6bbc79879d37473836771441a79d3d9dddfabacdac22ed315e5636ff819a318";
                const testCertificate = {
                    claim: this.user2.cruxID.toString(),
                    proof: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJtZXNzYWdlSWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAifQ.SjDx_vGQuqLDXtP38nWrzlx5PKbOgUsKhbF6HOtAQVDdGw4RiieRqNQ6kVii5to-cqBYrY6gisSQ7jltWmuKIA"
                };
                const testMessageId = "123e4567-e89b-12d3-a456-426614174000";
                const testVerificationMessageId = "123e4567-e89b-12d3-a456-426614174000";
                const certificate = await CertificateManager.make(this.user2IDClaim, testMessageId);
                expect(certificate.claim).to.equals(testCertificate.claim);
                expect(certificate.proof).to.equals(testCertificate.proof);
                const validation = CertificateManager.verify(senderPubKey, certificate);
                expect(validation).to.equals(testVerificationMessageId);
            });

            it('Test Certificate Creation and Verification with wrong proof', async function() {
                
                const senderPubKey = "02bc9c3f8e924b7de9212cebd0129f1be2e6c3f2904e911b30698bde77be4878b8";
                const testCertificate = {
                    claim: this.user2.cruxID.toString(),
                    proof: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJtZXNzYWdlSWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAifQ.SjDx_vGQuqLDXtP38nWrzlx5PKbOgUsKhbF6HOtAQVDdGw4RiieRqNQ6kVii5to-cqBYrY6gisSQ7jltWmuKIA"
                };
                const testMessageId = "123e4567-e89b-12d3-a456-426614174000";
                const testVerificationMessageId = "Could not verify sender certificate";
                const certificate = await CertificateManager.make(this.user2IDClaim, testMessageId);
                expect(certificate.claim).to.equals(testCertificate.claim);
                expect(certificate.proof).to.equals(testCertificate.proof);
                const validation = CertificateManager.verify(senderPubKey, certificate);
                expect(validation).to.equals(testVerificationMessageId);
            });

        });


        // TODO: Test Certificate validation failed
        // TODO: Allow Only Certified Messages
        // TODO: Encrypted Messages only
    });
});
