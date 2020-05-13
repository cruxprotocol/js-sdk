import { expect } from 'chai';
import 'mocha';
import { BasicKeyManager } from '../../infrastructure/implementations/basic-key-manager';
import { EncryptionManager } from '../../core/domain-services/crux-messenger';

describe("Asymmetric encryption tests", () => {
    let basicKeyManager: BasicKeyManager;
    const testPrivateKey = "2982735d0b69751e1d13fcb045757e372c1d85b8bdc66995a5a073be648e5f26";
    const testPrivateKey2 = "12381ab829318742938647283cd462738462873642ef34abefcd123501827193";
    const sampleMessage = "exampleValue";
    describe("Asymmetric encryption using eccrypto tests", () => {
        beforeEach(() => {
            basicKeyManager = new BasicKeyManager(testPrivateKey);
        })
        it("encrypt and decrypt test", async () => {
            const testPublicKey = await basicKeyManager.getPubKey();
            const encrypted = await EncryptionManager.encrypt(sampleMessage, testPublicKey);
            const decrypted = await EncryptionManager.decrypt(encrypted, basicKeyManager);
            expect(decrypted).to.be.eql(sampleMessage);
        })
        it("decrypt test", async () => {
            const encryptedMessage = '{"ciphertext":"dfc1e678decbdd5e2b8a23f4963540a0","ephemPublicKey":"040cc480a70e6673cc96338463803cca329aba6cd9441e5cbb468fa580abfbea908f1e923c0eec29994f248122bb1bf2e4ddeb4014f79bc033dd6c1335c64cfdbf","iv":"0d5ff081568891d14135a48e56233da3","mac":"73f69c129fcc53dfaa716ad464e2bb73bffe2119bc2df2e98de6132c01a20db1"}';
            const decrypted = await EncryptionManager.decrypt(encryptedMessage, basicKeyManager);
            expect(decrypted).to.be.eql(sampleMessage);
        })
        it("decrypt with wrong key test", async () => {
            const encryptedMessage = '{"ciphertext":"dfc1e678decbdd5e2b8a23f4963540a0","ephemPublicKey":"040cc480a70e6673cc96338463803cca329aba6cd9441e5cbb468fa580abfbea908f1e923c0eec29994f248122bb1bf2e4ddeb4014f79bc033dd6c1335c64cfdbf","iv":"0d5ff081568891d14135a48e56233da3","mac":"73f69c129fcc53dfaa716ad464e2bb73bffe2119bc2df2e98de6132c01a20db1"}';
            const testKeyManager = new BasicKeyManager(testPrivateKey2);
            let raisedError;
        try {
            const decrypted = await EncryptionManager.decrypt(encryptedMessage, testKeyManager);
        } catch (e) {
            raisedError = e;
        }
        expect(raisedError.message).to.be.eql("Decryption failed");
        })
    })
})