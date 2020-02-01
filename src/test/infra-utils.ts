import { expect } from 'chai';
import 'mocha';
import { BasicKeyManager } from '../infrastructure/implementations/basic-key-manager';
import { decodeToken } from 'jsontokens';

describe("Infrastructure Utils tests", () => {
    describe("BasicKeyManager tests", () => {
        let basicKeyManager: BasicKeyManager;
        const testPrivateKey = "2982735d0b69751e1d13fcb045757e372c1d85b8bdc66995a5a073be648e5f26";
        const testPublicKey = "03da5e78c86e06c0b61580d73a38e31a511f36f1a5238a144b98b18608b90fa72e";
        const samplePayload = { exampleKey: "exampleValue" };
        describe("BasicKeyManager tests (without getEncryptionKey)", () => {
            beforeEach(() => {
                basicKeyManager = new BasicKeyManager(testPrivateKey);
            })
            it("signWebToken test", async () => {
                const signedWebToken = await basicKeyManager.signWebToken(samplePayload);
                expect(signedWebToken).to.be.string;
                expect(decodeToken(signedWebToken).payload).to.be.eql(samplePayload);
            })
            it("getPubKey test", async () => {
                const publicKey = await basicKeyManager.getPubKey();
                expect(publicKey).to.be.equal(testPublicKey);
            })
        })
        it("BasicKeyManager test (with getEncryptionKey)", async () => {
            const sampleGetEncryptionKey = async () => "sampleEncryptionKey";
            const keyManager = new BasicKeyManager(testPrivateKey, sampleGetEncryptionKey);
            const signedWebToken = await keyManager.signWebToken(samplePayload);
            expect(signedWebToken).to.be.string;
            expect(decodeToken(signedWebToken).payload).to.be.eql(samplePayload);
        })
    })
})