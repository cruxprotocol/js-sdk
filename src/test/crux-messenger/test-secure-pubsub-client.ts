import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import 'mocha';
import {SecureCruxIdMessenger} from "../../core/domain-services";
import {BasicKeyManager} from "../../infrastructure/implementations";
import {InMemoryCruxUserRepository, MockUserStore, patchMissingDependencies} from "../test-utils";
import {InMemoryPubSubClientFactory} from "./inmemory-implementations";
import {getMockUserBar123CSTestWallet, getMockUserFoo123CSTestWallet} from "./utils";

patchMissingDependencies();

chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;


describe('Test Secure PUbsub Client Tests', function() {
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
    });

    it('Nonexistent wallet name raises error', async function() {
        return new Promise(async (resolve, reject) => {
            const user1Messenger = new SecureCruxIdMessenger(this.inmemUserRepo, this.pubsubClientFactory, {
                cruxId: this.user1Data.cruxUser.cruxID,
                keyManager: new BasicKeyManager(this.user1Data.pvtKey)
            });

            const user2Messenger = new SecureCruxIdMessenger(this.inmemUserRepo, this.pubsubClientFactory, {
                cruxId: this.user2Data.cruxUser.cruxID,
                keyManager: new BasicKeyManager(this.user2Data.pvtKey)
            });
            const testmsg = 'HelloWorld';
            user2Messenger.listen((msg) => {
                expect(msg).equals(testmsg);
                resolve()
            });
            await user1Messenger.send(testmsg, this.user2Data.cruxUser.cruxID);
        });

    });

})
