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
                        
                const testCeritficate = {
                    claim: this.user2.cruxID.toString(),
                    messageId : "123e4567-e89b-12d3-a456-426614174000",
                    proof: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJtZXNzYWdlSWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAifQ.SjDx_vGQuqLDXtP38nWrzlx5PKbOgUsKhbF6HOtAQVDdGw4RiieRqNQ6kVii5to-cqBYrY6gisSQ7jltWmuKIA",
                    senderPubKey: "03e6bbc79879d37473836771441a79d3d9dddfabacdac22ed315e5636ff819a318"
                };
                const certificate = await CertificateManager.make(this.user2IDClaim,"123e4567-e89b-12d3-a456-426614174000");
                expect(certificate.claim).to.equals(testCeritficate.claim);
                expect(certificate.messageId).to.equals(testCeritficate.messageId);
                expect(certificate.proof).to.equals(testCeritficate.proof);
                expect(certificate.senderPubKey).to.equals(testCeritficate.senderPubKey);
            });

            it('Test Certificate Creation and checking with wrong messageId check', async function() {
                        
                const testCeritficate = {
                    claim: this.user2.cruxID.toString(),
                    messageId : "223e4567-e89b-12d3-a456-426614174000",
                    proof: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJtZXNzYWdlSWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAifQ.SjDx_vGQuqLDXtP38nWrzlx5PKbOgUsKhbF6HOtAQVDdGw4RiieRqNQ6kVii5to-cqBYrY6gisSQ7jltWmuKIA",
                    senderPubKey: "03e6bbc79879d37473836771441a79d3d9dddfabacdac22ed315e5636ff819a318"
                };
                const certificate = await CertificateManager.make(this.user2IDClaim,"123e4567-e89b-12d3-a456-426614174000");
                expect(certificate.claim).to.equals(testCeritficate.claim);
                expect(certificate.messageId).to.not.equals(testCeritficate.messageId);
                expect(certificate.proof).to.equals(testCeritficate.proof);
                expect(certificate.senderPubKey).to.equals(testCeritficate.senderPubKey);
            });

            it('Test Certificate Creation with wrong claim check', async function() {
                        
                const testCeritficate = {
                    claim: this.user1.cruxID.toString(),
                    messageId : "123e4567-e89b-12d3-a456-426614174000",
                    proof: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJtZXNzYWdlSWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAifQ.SjDx_vGQuqLDXtP38nWrzlx5PKbOgUsKhbF6HOtAQVDdGw4RiieRqNQ6kVii5to-cqBYrY6gisSQ7jltWmuKIA",
                    senderPubKey: "03e6bbc79879d37473836771441a79d3d9dddfabacdac22ed315e5636ff819a318"
                };
                const certificate = await CertificateManager.make(this.user2IDClaim,"123e4567-e89b-12d3-a456-426614174000");
                expect(certificate.claim).to.not.equals(testCeritficate.claim);
                expect(certificate.messageId).to.equals(testCeritficate.messageId);
                expect(certificate.proof).to.equals(testCeritficate.proof);
                expect(certificate.senderPubKey).to.equals(testCeritficate.senderPubKey);
            });

            it('Test Certificate Creation with wrong proof check', async function() {
                        
                const testCeritficate = {
                    claim: this.user2.cruxID.toString(),
                    messageId : "123e4567-e89b-12d3-a456-426614174000",
                    proof: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJtZXNzYWdlSWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAifQ.iaa0Y9mPDBv8V_fVMRrJuqRyYcVvHYqbZcTGWFrDSwezJt6R7NQbHoA36fq0av51Q2LKJsQJHAwMfc-ph806fA",
                    senderPubKey: "02e6bbc79879d37473836771441a79d3d9dddfabacdac22ed315e5636ff819a318"
                };
                const certificate = await CertificateManager.make(this.user2IDClaim,"123e4567-e89b-12d3-a456-426614174000");
                expect(certificate.claim).to.equals(testCeritficate.claim);
                expect(certificate.messageId).to.equals(testCeritficate.messageId);
                expect(certificate.proof).to.not.equals(testCeritficate.proof);
                expect(certificate.senderPubKey).to.not.equals(testCeritficate.senderPubKey);
            });

            it('Test Certificate Creation with wrong public key check', async function() {
                        
                const testCeritficate = {
                    claim: this.user2.cruxID.toString(),
                    messageId : "123e4567-e89b-12d3-a456-426614174000",
                    proof: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJtZXNzYWdlSWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAifQ.SjDx_vGQuqLDXtP38nWrzlx5PKbOgUsKhbF6HOtAQVDdGw4RiieRqNQ6kVii5to-cqBYrY6gisSQ7jltWmuKIA",
                    senderPubKey: "02e6bbc79879d37473836771441a79d3d9dddfabacdac22ed315e5636ff819a318"
                };
                const certificate = await CertificateManager.make(this.user2IDClaim,"123e4567-e89b-12d3-a456-426614174000");
                expect(certificate.claim).to.equals(testCeritficate.claim);
                expect(certificate.messageId).to.equals(testCeritficate.messageId);
                expect(certificate.proof).to.equals(testCeritficate.proof);
                expect(certificate.senderPubKey).to.not.equals(testCeritficate.senderPubKey);
            });
        });

        describe('Certificate Verification', function() {
            it('Test Certificate Verification', async function() {
                
                const testCeritficate = {
                    claim: this.user2.cruxID.toString(),
                    messageId : "123e4567-e89b-12d3-a456-426614174000",
                    proof: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJtZXNzYWdlSWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAifQ.SjDx_vGQuqLDXtP38nWrzlx5PKbOgUsKhbF6HOtAQVDdGw4RiieRqNQ6kVii5to-cqBYrY6gisSQ7jltWmuKIA",
                    senderPubKey: "03e6bbc79879d37473836771441a79d3d9dddfabacdac22ed315e5636ff819a318"
                };
                const testValidation = true;
                const validation = CertificateManager.verify(this.user2IDClaim, testCeritficate);
                expect(validation).to.equals(testValidation);
            });

            it('Test Certificate Verification without claim', async function() {
                  
                const testCeritficate = {
                    claim: undefined,
                    messageId : "123e4567-e89b-12d3-a456-426614174000",
                    proof: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJtZXNzYWdlSWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAifQ.SjDx_vGQuqLDXtP38nWrzlx5PKbOgUsKhbF6HOtAQVDdGw4RiieRqNQ6kVii5to-cqBYrY6gisSQ7jltWmuKIA",
                    senderPubKey: "03e6bbc79879d37473836771441a79d3d9dddfabacdac22ed315e5636ff819a318"
                };
                const testValidation = false;
                const validation = CertificateManager.verify(undefined, testCeritficate);
                expect(validation).to.equals(testValidation);
            });

            it('Test Certificate Verification with wrong public key', async function() {
                
                const testCeritficate = {
                    claim: this.user2.cruxID.toString(),
                    messageId : "123e4567-e89b-12d3-a456-426614174000",
                    proof: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJtZXNzYWdlSWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAifQ.SjDx_vGQuqLDXtP38nWrzlx5PKbOgUsKhbF6HOtAQVDdGw4RiieRqNQ6kVii5to-cqBYrY6gisSQ7jltWmuKIA",
                    senderPubKey: "02e6bbc79879d37473836771441a79d3d9dddfabacdac22ed315e5636ff819a318"
                };
                const testValidation = false;
                const validation = CertificateManager.verify(this.user1IDClaim, testCeritficate);
                expect(validation).to.equals(testValidation);
            });

            it('Test Certificate Verification with wrong messageId', async function() {
                
                const testCeritficate = {
                    claim: this.user2.cruxID.toString(),
                    messageId : "223e4567-e89b-12d3-a456-426614174000",
                    proof: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJtZXNzYWdlSWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAifQ.SjDx_vGQuqLDXtP38nWrzlx5PKbOgUsKhbF6HOtAQVDdGw4RiieRqNQ6kVii5to-cqBYrY6gisSQ7jltWmuKIA",
                    senderPubKey: "03e6bbc79879d37473836771441a79d3d9dddfabacdac22ed315e5636ff819a318"
                };
                const testValidation = false;
                const validation = CertificateManager.verify(this.user1IDClaim, testCeritficate);
                expect(validation).to.equals(testValidation);
            });

            it('Test Certificate Verification with wrong proof', async function() {
                
                const testCeritficate = {
                    claim: this.user2.cruxID.toString(),
                    messageId : "123e4567-e89b-12d3-a456-426614174000",
                    proof: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJtZXNzYWdlSWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAifQ.iaa0Y9mPDBv8V_fVMRrJuqRyYcVvHYqbZcTGWFrDSwezJt6R7NQbHoA36fq0av51Q2LKJsQJHAwMfc-ph806fA",
                    senderPubKey: "03e6bbc79879d37473836771441a79d3d9dddfabacdac22ed315e5636ff819a318"
                };
                const testValidation = false;
                const validation = CertificateManager.verify(this.user1IDClaim, testCeritficate);
                expect(validation).to.equals(testValidation);
            });
        });

        describe('Certificate Creation and Verification', function() {

            it('Test Certificate Creation and Verification', async function() {
                
                const testCeritficate = {
                    claim: this.user2.cruxID.toString(),
                    messageId : "123e4567-e89b-12d3-a456-426614174000",
                    proof: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJtZXNzYWdlSWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAifQ.SjDx_vGQuqLDXtP38nWrzlx5PKbOgUsKhbF6HOtAQVDdGw4RiieRqNQ6kVii5to-cqBYrY6gisSQ7jltWmuKIA",
                    senderPubKey: "03e6bbc79879d37473836771441a79d3d9dddfabacdac22ed315e5636ff819a318"
                };
                const testMessageId = "123e4567-e89b-12d3-a456-426614174000";
                const testValidation = true;
                const certificate = await CertificateManager.make(this.user2IDClaim, testMessageId);
                expect(certificate.claim).to.equals(testCeritficate.claim);
                expect(certificate.messageId).to.equals(testCeritficate.messageId);
                expect(certificate.proof).to.equals(testCeritficate.proof);
                expect(certificate.senderPubKey).to.equals(testCeritficate.senderPubKey);
                const validation = CertificateManager.verify(this.user1IDClaim, certificate);
                expect(validation).to.equals(testValidation);
            });

        });


        // TODO: Test Certificate validation failed
        // TODO: Allow Only Certified Messages
        // TODO: Encrypted Messages only
    });
});
