import { expect } from 'chai';
import 'mocha';
import { BasicKeyManager } from '../../infrastructure/implementations/basic-key-manager';
import { Encryption } from "../../packages/encryption";

describe("Asymmetric encryption tests", () => {
    let basicKeyManager: BasicKeyManager;
    const testPrivateKey = "2982735d0b69751e1d13fcb045757e372c1d85b8bdc66995a5a073be648e5f26";
    const testPublicKey = "03da5e78c86e06c0b61580d73a38e31a511f36f1a5238a144b98b18608b90fa72e";
    const sampleMessage = "exampleValue";
    describe("Asymmetric encryption using eccrypto tests", () => {
        beforeEach(() => {
            basicKeyManager = new BasicKeyManager(testPrivateKey);
        })
        it("encrypt and decrypt test", async () => {
            const encrypted = await Encryption.encryptMessage(sampleMessage, testPublicKey);
            const decrypted = await basicKeyManager.decryptMessage(encrypted);
            expect(decrypted).to.be.eql(sampleMessage);
        })
    })
})