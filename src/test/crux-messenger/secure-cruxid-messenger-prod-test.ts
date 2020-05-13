import * as chai from "chai";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import 'mocha';
import {SecureCruxIdMessenger} from "../../core/domain-services";
import {BasicKeyManager, CruxNetPubSubClientFactory} from "../../infrastructure/implementations";
import {patchMissingDependencies, getCruxdevCruxDomain} from "../test-utils";
import {getCruxUserRepository} from "../../application/clients";
import {CruxSpec} from "../../core/entities";

patchMissingDependencies();

chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;


const user1PvtKey = "KyBuSe1MMV6NjJgZfyWuvgmxUeAYswLC2HrfYLUri9aP3AS5FBfr"; // release020@cruxdev.crux
const user2PvtKey = "cdf2d276caf0c9c34258ed6ebd0e60e0e8b3d9a7b8a9a717f2e19ed9b37f7c6f"; // mascott6699@cruxdex.crux

describe('Test Secure Crux Messenger - PROD', function() {
    beforeEach(async function() {
        const HOST = "127.0.0.1";
        const PORT = 1883;
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
    it('Basic Send Receive Test - PROD', async function() {
        const testmsg = 'HelloWorld';
        return new Promise(async (resolve, reject) => {
            const user1Messenger = new SecureCruxIdMessenger(this.userRepo, this.pubsubClientFactory, {
                cruxId: this.user1Data.cruxID,
                keyManager: this.user1KeyManager
            });

            const user2Messenger = new SecureCruxIdMessenger(this.userRepo, this.pubsubClientFactory, {
                cruxId: this.user2Data.cruxID,
                keyManager: this.user2KeyManager
            });
            user2Messenger.listen((msg) => {
                expect(msg).equals(testmsg)
                resolve(msg)
            },(err) => {
                reject(err)
            });
            await user1Messenger.send(testmsg, this.user2Data.cruxID);
        });

    });
})
