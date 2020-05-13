import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import 'mocha';
import {CertificateManager} from "../../core/domain-services";
import {BasicKeyManager} from "../../infrastructure/implementations";
import {InMemoryCruxUserRepository, MockUserStore, patchMissingDependencies} from "../test-utils";
import {InMemoryPubSubClientFactory} from "./inmemory-implementations";
import {getMockUserBar123CSTestWallet, getMockUserFoo123CSTestWallet} from "./utils";
import { decodeToken } from "jsontokens";

patchMissingDependencies();

chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;


describe('Test Certificate Manager', function() {
    beforeEach(async function() {
        const userStore = new MockUserStore();
        const user1Data = getMockUserFoo123CSTestWallet();
        const user2Data = getMockUserBar123CSTestWallet();
        this.user1Data = user1Data;
        this.user2Data = user2Data;
        userStore.store(user1Data.cruxUser);
        userStore.store(user2Data.cruxUser);
        this.inmemUserRepo = new InMemoryCruxUserRepository(userStore);
        this.pubsubClientFactory = new InMemoryPubSubClientFactory();
        this.user1IDClaim = {
            cruxId: this.user1Data.cruxUser.cruxID,
            keyManager: new BasicKeyManager(this.user1Data.pvtKey)
        }
        this.user2IDClaim = {
            cruxId: this.user2Data.cruxUser.cruxID,
            keyManager: new BasicKeyManager(this.user2Data.pvtKey)
        }
    });

    describe('Certificate Creation', function() {

        it('Test Certificate Creation', async function() {
                    
            const testCertificate = {
                claim: this.user2Data.cruxUser.cruxID.toString(),
                proof: this.user2Data.cruxUser.cruxID.toString()
            };
            const certificate = await CertificateManager.make(this.user2IDClaim);
            expect(certificate.claim).to.equals(testCertificate.claim);
            expect(decodeToken(certificate.proof).payload).to.equals(testCertificate.proof);
        });

        it('Test Certificate Creation with wrong claim check', async function() {
                    
            const testCertificate = {
                claim: this.user1Data.cruxUser.cruxID.toString(),
                proof: this.user2Data.cruxUser.cruxID.toString()
            };
            const certificate = await CertificateManager.make(this.user2IDClaim);
            expect(certificate.claim).to.not.equals(testCertificate.claim);
            expect(decodeToken(certificate.proof).payload).to.equals(testCertificate.proof);
        });

        it('Test Certificate Creation with wrong proof check', async function() {
                    
            const testCertificate = {
                claim: this.user2Data.cruxUser.cruxID.toString(),
                proof: this.user1Data.cruxUser.cruxID.toString()
            };
            const certificate = await CertificateManager.make(this.user2IDClaim);
            expect(certificate.claim).to.equals(testCertificate.claim);
            expect(decodeToken(certificate.proof).payload).to.not.equals(testCertificate.proof);
        });

    });

    describe('Certificate Verification', function() {
        it('Test Certificate Verification', async function() {
            
            const senderPubKey = "03e6bbc79879d37473836771441a79d3d9dddfabacdac22ed315e5636ff819a318";
            const testCertificate = {
                claim: this.user2Data.cruxUser.cruxID.toString(),
                proof: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.ImJhcjEyM0Bjc3Rlc3R3YWxsZXQuY3J1eCI.Lsyz2HzB-MH2n0xyCymOSDNYzLFF8JdX2XK-UWmiY9b6B1etkxVMmMcO5HvL4osor2g8zpWz61j8sKqX3L7dwA"
            };
            const testVerification = true;
            const validation = CertificateManager.verify(testCertificate, senderPubKey);
            expect(validation).to.equals(testVerification);
        });

        it('Test Certificate Verification with wrong public key', async function() {
            
            const senderPubKey = "02bc9c3f8e924b7de9212cebd0129f1be2e6c3f2904e911b30698bde77be4878b8";
            const testCertificate = {
                claim: this.user2Data.cruxUser.cruxID.toString(),
                proof: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.ImJhcjEyM0Bjc3Rlc3R3YWxsZXQuY3J1eCI.Lsyz2HzB-MH2n0xyCymOSDNYzLFF8JdX2XK-UWmiY9b6B1etkxVMmMcO5HvL4osor2g8zpWz61j8sKqX3L7dwA"
            };
            const testVerification = false;
            expect(CertificateManager.verify(testCertificate, senderPubKey)).to.equals(testVerification);
        });

        it('Test Certificate Verification with wrong proof', async function() {
            
            const senderPubKey = "03e6bbc79879d37473836771441a79d3d9dddfabacdac22ed315e5636ff819a318";
            const testCertificate = {
                claim: this.user2Data.cruxUser.cruxID.toString(),
                proof: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJtZXNzYWdlSWQiOiIxMjMifQ.ViC_JnoZ7DTpXy9ZS7BWhp3tyatkXp2LaXjTDQVt3rz1T9QWJm8WgiTmJP6PufDEqzXQ71N6Zu_PyMJMibApig"
            };
            const testVerification = false;
            expect(CertificateManager.verify(testCertificate, senderPubKey)).to.equals(testVerification);
        });
    });

    describe('Certificate Creation and Verification', function() {

        it('Test Certificate Creation and Verification', async function() {
            
            const senderPubKey = "03e6bbc79879d37473836771441a79d3d9dddfabacdac22ed315e5636ff819a318";
            const testCertificate = {
                claim: this.user2Data.cruxUser.cruxID.toString(),
                proof: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.ImJhcjEyM0Bjc3Rlc3R3YWxsZXQuY3J1eCI.Lsyz2HzB-MH2n0xyCymOSDNYzLFF8JdX2XK-UWmiY9b6B1etkxVMmMcO5HvL4osor2g8zpWz61j8sKqX3L7dwA"
            };
            const testVerification = true;
            const certificate = await CertificateManager.make(this.user2IDClaim);
            expect(certificate.claim).to.equals(testCertificate.claim);
            expect(decodeToken(certificate.proof).payload).to.equals(decodeToken(testCertificate.proof).payload);
            const validation = CertificateManager.verify(testCertificate, senderPubKey);
            expect(validation).to.equals(testVerification);
        });

    });


    // TODO: Test Certificate validation failed
    // TODO: Allow Only Certified Messages
    // TODO: Encrypted Messages only
});
