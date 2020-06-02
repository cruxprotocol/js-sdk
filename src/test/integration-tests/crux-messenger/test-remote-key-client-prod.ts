import * as chai from "chai";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import 'mocha';
import * as blockstack from "blockstack";
import {RemoteKeyClient, RemoteKeyHost, RemoteKeyManager, SecureCruxNetwork, CruxProtocolMessenger} from "../../../core/domain-services";
import {BasicKeyManager, CruxNetPubSubClientFactory, keyManagementProtocol} from "../../../infrastructure/implementations";
import {CruxId, InMemStorage, BufferJSONSerializer} from "../../../packages";
import {InMemoryCruxUserRepository, MockUserStore, patchMissingDependencies, getCruxdevCruxDomain} from "../../test-utils";
import { bip32 } from "bitcoinjs-lib";
import * as bip39 from "bip39";
import { getCruxUserRepository } from "../../../application/clients";
import { CruxSpec } from "../../../core/entities";
import { ECIESEncryption } from "../../../packages/encryption";

patchMissingDependencies();

chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;

const user1PvtKey = "cdf2d276caf0c9c34258ed6ebd0e60e0e8b3d9a7b8a9a717f2e19ed9b37f7c6f"; // mascot6699@cruxdex.crux
const user2PvtKey = "KyBuSe1MMV6NjJgZfyWuvgmxUeAYswLC2HrfYLUri9aP3AS5FBfr"; // release020@cruxdev.crux

describe('Test RemoteKeyClient - PROD', function() {
    beforeEach(async function() {
        const HOST = "broker.hivemq.com";
        const PORT = 8000;
        this.user2CruxId = "release020@cruxdev.crux";
        this.user1KeyManager = new BasicKeyManager(user1PvtKey);
        this.user2KeyManager = new BasicKeyManager(user2PvtKey);
        this.userRepo = getCruxUserRepository({
            blockstackInfrastructure: CruxSpec.blockstack.infrastructure,
            cruxDomain: getCruxdevCruxDomain(),
            cacheStorage: new InMemStorage(),
        });
        this.user1Data = await this.userRepo.getWithKey(this.user1KeyManager);
        this.user2Data = await this.userRepo.getWithKey(this.user2KeyManager);
        this.pubsubClientFactory = new CruxNetPubSubClientFactory({
            defaultLinkServer: {
                host: HOST,
                port: PORT,
                path: "/mqtt"
            }
        });
        const toEncrypt = Buffer.from("content", "utf8");
        const encrypted = await ECIESEncryption.encrypt(toEncrypt, "0362f171a40ab5e6ad22275ec166f15a232b83a571bab9c30622ed2963f1da4c08");
        this.testEncryptedData = BufferJSONSerializer.bufferObjectToJSONString(encrypted);
        this.secureCruxNetwork1 = new SecureCruxNetwork(this.userRepo, this.pubsubClientFactory, {
            cruxId: this.user1Data.cruxID,
            keyManager: this.user1KeyManager
        });
        this.secureCruxNetwork2 = new SecureCruxNetwork(this.userRepo, this.pubsubClientFactory, {
            cruxId: this.user2Data.cruxID,
            keyManager: this.user2KeyManager
        });
        this.cruxProtocolMessenger1 = new CruxProtocolMessenger(this.secureCruxNetwork1, keyManagementProtocol);
        this.cruxProtocolMessenger2 = new CruxProtocolMessenger(this.secureCruxNetwork2, keyManagementProtocol);
        await this.cruxProtocolMessenger1.initialize();
        await this.cruxProtocolMessenger2.initialize();
    });

    it('Send Receive RemoteKeyClient<->RemoteKeyHost - Prod', async function() {
        const testPublicKey = '0239d9d97d5b8973fba462b1a014bcbb84d056061234fd375442a7ef0620ea88c3';
        return new Promise(async (resolve, reject) => {
            const remoteKeyClient = new RemoteKeyClient(this.cruxProtocolMessenger1, this.user2Data.cruxID);
            await remoteKeyClient.initialize();
            const remoteKeyHost = new RemoteKeyHost(this.cruxProtocolMessenger2, this.user2KeyManager);
            await remoteKeyHost.initialize()
            const invocationId = await remoteKeyClient.invoke("getPubKey", []);
            remoteKeyClient.listenToInvocation(invocationId, (msg, senderId) => {
                console.log("TESTCASE::msg.result.data", msg.result.data);
                expect(msg.result.data).equals(testPublicKey);
                resolve(msg)
            },(err) => {
                reject(err)
            });
        });
    });

    it('Send Receive RemoteKeyManager<->RemoteKeyHost - RemoteKeyManager - Prod', async function() {
        const testPubKey = "0362f171a40ab5e6ad22275ec166f15a232b83a571bab9c30622ed2963f1da4c08";
        return new Promise(async (resolve, reject) => {
            const remoteKeyManager = new RemoteKeyManager(this.cruxProtocolMessenger2, this.user1Data.cruxID);
            await remoteKeyManager.initialize();
            const remoteKeyHost = new RemoteKeyHost(this.cruxProtocolMessenger1, this.user1KeyManager);
            await remoteKeyHost.initialize();
            const signedWebToken = await remoteKeyManager.signWebToken("1234567")
            console.log("TESTCASE::signWebToken:",  signedWebToken);
            expect(signedWebToken).to.have.length(138);
            const publicKey = await remoteKeyManager.getPubKey();
            console.log("TESTCASE::publicKey", publicKey);
            expect(publicKey).equals(testPubKey);
            const sharedSecret = await remoteKeyManager.deriveSharedSecret(testPubKey)
            console.log("TESTCASE::sharedSecret", sharedSecret);
            expect(sharedSecret).equals("d2744fdfa47538b816623e75cc783469cbe3d71da02965edd662ae3f45fbac3");
            const decryptedMessage = await remoteKeyManager.decryptMessage(this.testEncryptedData);
            console.log("TESTCASE::decryptedMessage", decryptedMessage);
            expect(decryptedMessage).equals("content");
            resolve();
        });
    });
})
