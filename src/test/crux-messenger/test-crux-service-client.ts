import * as chai from "chai";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import 'mocha';
import * as cwc from "../../application/clients/crux-wallet-client";
import {SecureCruxNetwork, RemoteKeyClient, RemoteKeyHost, RemoteKeyManager} from "../../core/domain-services";
import {BasicKeyManager, keyManagementProtocol} from "../../infrastructure/implementations";
import {CruxId, BufferJSONSerializer, InMemStorage} from "../../packages";
import {InMemoryCruxUserRepository, MockUserStore, patchMissingDependencies, InMemoryCruxDomainRepository, getSomewalletDomain, addUserToRepo, addDomainToRepo} from "../test-utils";
import {InMemoryPubSubClientFactory, InMemoryMaliciousPubSubClientFactory} from "./inmemory-implementations";
import {getMockUserBar123CSTestWallet, getMockUserFoo123CSTestWallet, getCstestwalletCruxDomain} from "./utils";
import { ECIESEncryption } from "../../packages/encryption";
import { CruxWalletClient, CruxServiceClient } from "../../application/clients";

patchMissingDependencies();

chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;

describe('Test CruxServiceClient - InMemory', function() {
    beforeEach(async function() {
        const userStore = new MockUserStore();
        const user1Data = getMockUserFoo123CSTestWallet();
        const user2Data = getMockUserBar123CSTestWallet();
        const testCruxDomain = getCstestwalletCruxDomain();
        this.user1Data = user1Data;
        this.user2Data = user2Data;
        userStore.store(user1Data.cruxUser);
        userStore.store(user2Data.cruxUser);
        this.inmemUserRepo = new InMemoryCruxUserRepository(userStore, testCruxDomain);
        this.inmemDomainRepo = new InMemoryCruxDomainRepository();
        this.inmemDomainRepo = await addDomainToRepo(testCruxDomain, this.inmemDomainRepo);
        this.pubsubClientFactory = new InMemoryPubSubClientFactory();
        this.user1KeyManager = new BasicKeyManager(this.user1Data.pvtKey);
        this.user2KeyManager = new BasicKeyManager(this.user2Data.pvtKey);
        const toEncrypt = Buffer.from("content", "utf8");
        const encrypted = await ECIESEncryption.encrypt(toEncrypt, this.user2KeyManager.publicKey);
        this.testEncryptedData = BufferJSONSerializer.bufferObjectToJSONString(encrypted);
        this.stubGetCruxDomainRepository = sinon.stub(cwc, 'getCruxDomainRepository').callsFake(() => this.inmemDomainRepo as any);
        this.stubGetCruxUserRepository = sinon.stub(cwc, 'getCruxUserRepository').callsFake(() => this.inmemUserRepo as any);
        this.stubGetPubsubClientFactory = sinon.stub(cwc, 'getPubsubClientFactory').callsFake(() => this.pubsubClientFactory as any);
        this.secureCruxNetwork2 = new SecureCruxNetwork(this.inmemUserRepo, this.pubsubClientFactory, {
            cruxId: this.user2Data.cruxUser.cruxID,
            keyManager: new BasicKeyManager(this.user2Data.pvtKey)
        });
    });

    afterEach(function() {
        this.stubGetCruxUserRepository.restore();
        this.stubGetCruxDomainRepository.restore();
        this.stubGetPubsubClientFactory.restore();
    });

    it('Send Receive - CruxWalletClient<->CruxServiceClient - getAddressMap', async function() {
        const cruxWalletClient = new CruxWalletClient({
            privateKey: this.user1Data.pvtKey,
            walletClientName: "cstestwallet",
            cacheStorage: new InMemStorage(),
        });
        const cruxServiceClient = new CruxServiceClient({
            cruxId: this.user2Data.cruxUser.cruxID,
            keyManager: this.user2KeyManager
        }, this.secureCruxNetwork2, keyManagementProtocol);

        const remoteWalletClient = await cruxServiceClient.getWalletClientForUser(this.user1Data.cruxUser.cruxID);
        const addressMap = await remoteWalletClient.getAddressMap();
        console.log("TESTCASE::AddressMap: ", addressMap);
    });

    it('Send Receive - CruxWalletClient<->CruxServiceClient - putAddressMap', async function() {
        const cruxWalletClient = new CruxWalletClient({
            privateKey: this.user1Data.pvtKey,
            walletClientName: "cstestwallet",
            cacheStorage: new InMemStorage(),
        });
        const cruxServiceClient = new CruxServiceClient({
            cruxId: this.user2Data.cruxUser.cruxID,
            keyManager: this.user2KeyManager
        }, this.secureCruxNetwork2, keyManagementProtocol);
        const remoteWalletClient = await cruxServiceClient.getWalletClientForUser(this.user1Data.cruxUser.cruxID);
        const addressMapResult = await remoteWalletClient.putAddressMap({
            "bitcoin": {
                addressHash: "d78c26f8-7c13-4909-bf62-57d7623f8ee8"
            }
        });
        console.log("TESTCASE::Address Map: ", addressMapResult);
    });
})