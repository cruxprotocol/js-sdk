window = undefined;
import signal from 'libsignal-protocol-nodejs';

import SessionRecord from 'libsignal-protocol-nodejs/src/SessionRecord.js';
import * as cwc from "../application/clients/crux-wallet-client";
import {BasicKeyManager} from "../infrastructure/implementations";
import sinon from "./crux-wallet-client";
import {util} from './signalutil';
import {SignalProtocolStore} from './signalutil';
import {addDomainToRepo, addUserToRepo, InMemoryCruxDomainRepository, InMemoryCruxUserRepository} from "./test-utils";

// const expect = require('chai').expect;

async function generateIdentity(store: any) {
    const identityKey = await signal.KeyHelper.generateIdentityKeyPair();
    const registrationId = await signal.KeyHelper.generateRegistrationId();
    await store.put('identityKey', identityKey)
    await store.put('registrationId', registrationId);

}

async function generatePreKeyBundle(store, preKeyId, signedPreKeyId) {
    const identity = await store.getIdentityKeyPair();
    const registrationId = await store.getLocalRegistrationId()

    const preKey = await signal.KeyHelper.generatePreKey(preKeyId);
    const signedPreKey = await signal.KeyHelper.generateSignedPreKey(identity, signedPreKeyId)
    await store.storePreKey(preKeyId, preKey.keyPair);
    await store.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair);

    return {
        identityKey: identity.pubKey,
        registrationId: registrationId,
        preKey: {
            keyId: preKeyId,
            publicKey: preKey.keyPair.pubKey
        },
        signedPreKey: {
            keyId: signedPreKeyId,
            publicKey: signedPreKey.keyPair.pubKey,
            signature: signedPreKey.signature
        }
    };
}



describe('test it', async function() {
    this.timeout(1000000)
    beforeEach(async function() {
        this.ALICE_ADDRESS = new signal.SignalProtocolAddress("+14151111111", 1);
        this.BOB_ADDRESS = new signal.SignalProtocolAddress("+14152222222", 1);
        this.aliceStore = new SignalProtocolStore();

        this.bobStore = new SignalProtocolStore();
        var bobPreKeyId = 1337;
        var bobSignedKeyId = 1;

        await generateIdentity(this.aliceStore);
        await generateIdentity(this.bobStore);
        const preKeyBundle = await generatePreKeyBundle(this.bobStore, bobPreKeyId, bobSignedKeyId);
        const builder = new signal.SessionBuilder(this.aliceStore, this.BOB_ADDRESS);
        await builder.processPreKey(preKeyBundle);


    });




    it('creates a session', async function(done) {
        const record = await this.aliceStore.loadSession(this.BOB_ADDRESS.toString())
        var sessionRecord = SessionRecord.deserialize(record);
        console.log("session created")

    });

    it('session can encrypt', async function(done) {
        var originalMessage = util.toArrayBuffer("L'homme est condamné à être libre");
        var aliceSessionCipher = new signal.SessionCipher(this.aliceStore, this.BOB_ADDRESS);
        const cipherText = await aliceSessionCipher.encrypt(originalMessage);

        var bobSessionCipher = new signal.SessionCipher(this.bobStore, this.ALICE_ADDRESS);
        const decryptedMessage = await bobSessionCipher.decryptPreKeyWhisperMessage(cipherText.body, 'binary');
        console.log(util.toString(decryptedMessage))


    });


});
