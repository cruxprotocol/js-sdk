import * as chai from "chai";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import 'mocha';
import {SecureCruxNetwork} from "../../../core/domain-services";
import {BasicKeyManager, CruxNetPubSubClientFactory} from "../../../infrastructure/implementations";
import {InMemStorage} from "../../../packages";
import {patchMissingDependencies, getCruxdevCruxDomain} from "../../test-utils";
import {getCruxUserRepository} from "../../../application/clients";
import {CruxSpec} from "../../../core/entities";

patchMissingDependencies();

chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;


const user1PvtKey = "KyBuSe1MMV6NjJgZfyWuvgmxUeAYswLC2HrfYLUri9aP3AS5FBfr"; // release020@cruxdev.crux
const user2PvtKey = "cdf2d276caf0c9c34258ed6ebd0e60e0e8b3d9a7b8a9a717f2e19ed9b37f7c6f"; // mascott6699@cruxdex.crux

describe('Test Secure Crux Messenger - PROD', function() {
    beforeEach(async function() {
        const HOST = "broker.hivemq.com";
        const PORT = 8000;
        const path = '/mqtt';
        this.user1KeyManager = new BasicKeyManager(user1PvtKey);
        this.user2KeyManager = new BasicKeyManager(user2PvtKey);
        this.userRepo = getCruxUserRepository({
            blockstackInfrastructure: CruxSpec.blockstack.infrastructure,
            cruxDomain: getCruxdevCruxDomain(),
            cacheStorage: new InMemStorage()
        });
        this.user1Data = await this.userRepo.getWithKey(this.user1KeyManager);
        this.user2Data = await this.userRepo.getWithKey(this.user2KeyManager);
        this.pubsubClientFactory = new CruxNetPubSubClientFactory({
            defaultLinkServer: {
                host: HOST,
                path: path,
                port: PORT,
            }
        });
    });
    it('Basic Send Receive Test - PROD', async function() {
        const testmsg = 'HelloWorld';
        return new Promise(async (resolve, reject) => {
            console.log("Initializing Network 1");
            const user1Messenger = new SecureCruxNetwork(this.userRepo, this.pubsubClientFactory, {
                cruxId: this.user1Data.cruxID,
                keyManager: this.user1KeyManager
            });
            await user1Messenger.initialize();
            // setTimeout(async ()=>{
                console.log("Initializing Network 2");
                const user2Messenger = new SecureCruxNetwork(this.userRepo, this.pubsubClientFactory, {
                    cruxId: this.user2Data.cruxID,
                    keyManager: this.user2KeyManager
                });
            await user2Messenger.initialize();
                user2Messenger.receive((msg, senderId) => {
                    expect(msg).equals(testmsg)
                    resolve(msg)
                });
                await user1Messenger.send(this.user2Data.cruxID, testmsg);
            // }, 5000)
        });

    });
})
