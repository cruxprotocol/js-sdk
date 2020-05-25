import * as chai from "chai";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import 'mocha';
import {SecureCruxIdMessenger, RemoteKeyClient, RemoteKeyHost} from "../../core/domain-services";
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
            remoteKeyHost.invocationListener((msg, senderId) => {
                if(msg.method === "getPubKey"){
                    new Promise(async (resolve, reject) => {
                        const data = await remoteKeyHost.handleMessage(msg);
                        remoteKeyHost.sendInvocationResult(data, senderId);
                        resolve();
                    });
                }
            },(err) => {
            });
            await remoteKeyClient.invoke("getPubKey", []);
        });
    });
})
