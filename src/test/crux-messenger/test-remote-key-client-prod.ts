import * as chai from "chai";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import 'mocha';
import * as blockstack from "blockstack";
import {SecureCruxIdMessenger, RemoteKeyClient, RemoteKeyHost, RemoteKeyManager} from "../../core/domain-services";
import {BasicKeyManager, CruxNetPubSubClientFactory} from "../../infrastructure/implementations";
import {CruxId} from "../../packages";
import {InMemoryCruxUserRepository, MockUserStore, patchMissingDependencies, getCruxdevCruxDomain} from "../test-utils";
import { bip32 } from "bitcoinjs-lib";
import * as bip39 from "bip39";
import { getCruxUserRepository } from "../../application/clients";
import { CruxSpec } from "../../core/entities";

patchMissingDependencies();

chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;

const user1PvtKey = "cdf2d276caf0c9c34258ed6ebd0e60e0e8b3d9a7b8a9a717f2e19ed9b37f7c6f"; // mascot6699@cruxdex.crux
const user2PvtKey = "KyBuSe1MMV6NjJgZfyWuvgmxUeAYswLC2HrfYLUri9aP3AS5FBfr"; // release020@cruxdev.crux

describe('Test RemoteKeyClient - PROD', function() {
    beforeEach(async function() {
        const HOST = "127.0.0.1";
        const PORT = 1883;
        this.user2CruxId = "release020@cruxdev.crux";
        this.user1KeyManager = new BasicKeyManager(user1PvtKey);
        this.user2KeyManager = new BasicKeyManager(user2PvtKey);
        this.userRepo = getCruxUserRepository({
            blockstackInfrastructure: CruxSpec.blockstack.infrastructure,
            cruxDomain: getCruxdevCruxDomain()
        });
        this.user1Data = await this.userRepo.getWithKey(this.user1KeyManager);
        this.user2Data = await this.userRepo.getWithKey(this.user2KeyManager);
        this.pubsubClientFactory = new CruxNetPubSubClientFactory({
            defaultLinkServer: {
                host: HOST,
                port: PORT,
            }
        });
    });

    it('Basic Key Manager Send Receive - RemoteKeyManager - Prod', async function() {
        const testPubKey = "0362f171a40ab5e6ad22275ec166f15a232b83a571bab9c30622ed2963f1da4c08";
        return new Promise(async (resolve, reject) => {
            const remoteKeyManager = new RemoteKeyManager(new SecureCruxIdMessenger(this.userRepo, this.pubsubClientFactory, {
                cruxId: this.user2Data.cruxID,
                keyManager: this.user2KeyManager
            }), this.user1Data.cruxID);

            const remoteKeyHost = new RemoteKeyHost(new SecureCruxIdMessenger(this.userRepo, this.pubsubClientFactory, {
                cruxId: this.user1Data.cruxID,
                keyManager: this.user1KeyManager
            }), this.user1KeyManager);

            const signedWebToken = await remoteKeyManager.signWebToken("1234567")
            console.log("TESTCASE::signWebToken:",  signedWebToken);
            expect(signedWebToken).to.have.length(138);
            const publicKey = await remoteKeyManager.getPubKey();
            console.log("TESTCASE::publicKey", publicKey);
            expect(publicKey).equals(testPubKey);
            // const sharedSecret = await remoteKeyManager.deriveSharedSecret(testPubKey)
            // console.log("TESTCASE::sharedSecret", sharedSecret);
            // expect(sharedSecret).equals("d2744fdfa47538b816623e75cc783469cbe3d71da02965edd662ae3f45fbac3");
            // const decryptedMessage = await remoteKeyManager.decryptMessage("4b4f34746f434c30354349312b41314b554f644542773d3d");
            // console.log(decryptedMessage);
            // expect(decryptedMessage).equals("");
            resolve();
        });
    });
})
