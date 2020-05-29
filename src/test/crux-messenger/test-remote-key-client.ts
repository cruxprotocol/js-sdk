import * as chai from "chai";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import 'mocha';
import {SecureCruxIdMessenger, RemoteKeyClient, RemoteKeyHost, RemoteKeyManager} from "../../core/domain-services";
import {BasicKeyManager} from "../../infrastructure/implementations";
import {CruxId} from "../../packages";
import {InMemoryCruxUserRepository, MockUserStore, patchMissingDependencies} from "../test-utils";
import {InMemoryPubSubClientFactory, InMemoryMaliciousPubSubClientFactory} from "./inmemory-implementations";
import {getMockUserBar123CSTestWallet, getMockUserFoo123CSTestWallet, getMockUserFooBar123CSTestWallet} from "./utils";

patchMissingDependencies();

chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;


describe('Test RemoteKeyClient', function() {
    beforeEach(async function() {
        const userStore = new MockUserStore();
        const user1Data = getMockUserFoo123CSTestWallet();
        const user2Data = getMockUserBar123CSTestWallet();
        // const user3Data = getMockUserFooBar123CSTestWallet();
        this.user1Data = user1Data;
        this.user2Data = user2Data;
        // this.user3Data = user3Data;
        userStore.store(user1Data.cruxUser);
        userStore.store(user2Data.cruxUser);
        this.inmemUserRepo = new InMemoryCruxUserRepository(userStore);
        this.pubsubClientFactory = new InMemoryPubSubClientFactory();
        this.user1KeyManager = new BasicKeyManager(this.user1Data.pvtKey);
        this.user2KeyManager = new BasicKeyManager(this.user2Data.pvtKey);
    });

    it('Basic Key Manager Send Receive', async function() {
        const testPublicKey = '03e6bbc79879d37473836771441a79d3d9dddfabacdac22ed315e5636ff819a318';
        return new Promise(async (resolve, reject) => {
            const remoteKeyClient = new RemoteKeyClient(new SecureCruxIdMessenger(this.inmemUserRepo, this.pubsubClientFactory, {
                cruxId: this.user1Data.cruxUser.cruxID,
                keyManager: this.user1KeyManager
            }), this.user2Data.cruxUser.cruxID);

            const remoteKeyHost = new RemoteKeyHost(new SecureCruxIdMessenger(this.inmemUserRepo, this.pubsubClientFactory, {
                cruxId: this.user2Data.cruxUser.cruxID,
                keyManager: this.user2KeyManager
            }), this.user2KeyManager);

            remoteKeyClient.invokeResult((msg, senderId) => {
                expect(msg.result.data).equals(testPublicKey);
                resolve(msg)
            },(err) => {
                reject(err)
            });
            await remoteKeyClient.invoke("getPubKey", []);
        });
    });

    it('Basic Key Manager Send Receive - RemoteKeyManager', async function() {
        const testPubKey = "03e6bbc79879d37473836771441a79d3d9dddfabacdac22ed315e5636ff819a318";
        return new Promise(async (resolve, reject) => {
            const remoteKeyManager = new RemoteKeyManager(new SecureCruxIdMessenger(this.inmemUserRepo, this.pubsubClientFactory, {
                cruxId: this.user1Data.cruxUser.cruxID,
                keyManager: this.user1KeyManager
            }), this.user2Data.cruxUser.cruxID);

            const remoteKeyHost = new RemoteKeyHost(new SecureCruxIdMessenger(this.inmemUserRepo, this.pubsubClientFactory, {
                cruxId: this.user2Data.cruxUser.cruxID,
                keyManager: this.user2KeyManager
            }), this.user2KeyManager);

            const signedWebToken = await remoteKeyManager.signWebToken("1234567")
            console.log(signedWebToken);
            expect(signedWebToken).to.have.length(138);
            const publicKey = await remoteKeyManager.getPubKey();
            console.log(publicKey);
            expect(publicKey).to.equals(testPubKey);
            const sharedSecret = await remoteKeyManager.deriveSharedSecret(testPubKey)
            console.log(sharedSecret);
            expect(sharedSecret).to.equals("3380b4752c9cebf96bc55491ef0ee67ae1d564c0bb931a0c6e8875be6e3bee5");
            // const decryptedMessage = await remoteKeyManager.decryptMessage("4b4f34746f434c30354349312b41314b554f644542773d3d");
            // console.log(decryptedMessage);
            // expect(decryptedMessage).to.equals("");
            resolve();
        });
    });
})
