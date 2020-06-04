import * as chai from "chai";
import * as blockstack from "blockstack";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import 'mocha';
import {SecureCruxNetwork} from "../../../core/domain-services";
import {CruxServiceClient, getCruxUserRepository, CruxWalletClient} from "../../../application/clients"
import {BasicKeyManager, CruxNetPubSubClientFactory, keyManagementProtocol} from "../../../infrastructure/implementations";
import {patchMissingDependencies, getCruxdevCruxDomain} from "../../test-utils";
import { CruxSpec, IAddress } from "../../../core/entities";
import { CruxId, InMemStorage } from "../../../packages";
import { bip32 } from "bitcoinjs-lib";
import * as bip39 from "bip39";

patchMissingDependencies();

chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;

const btcAddress: IAddress = {addressHash: "1HX4KvtPdg9QUYwQE1kNqTAjmNaDG7w82V"};
const user1PvtKey = "cdf2d276caf0c9c34258ed6ebd0e60e0e8b3d9a7b8a9a717f2e19ed9b37f7c6f"; // mascot6699@cruxdex.crux
const user2PvtKey = "KyBuSe1MMV6NjJgZfyWuvgmxUeAYswLC2HrfYLUri9aP3AS5FBfr"; // release020@cruxdev.crux

describe('Test CruxServiceClient - Prod', function() {
    beforeEach(async function() {
        const HOST = "127.0.0.1";
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
        this.secureCruxNetwork2 = new SecureCruxNetwork(this.userRepo, this.pubsubClientFactory, {
            cruxId: this.user2Data.cruxID,
            keyManager: new BasicKeyManager(user2PvtKey)
        });
    });
    it('Send Receive - CruxWalletClient<->CruxServiceClient - getAddressMap', async function() {
        const cruxWalletClient = new CruxWalletClient({
            privateKey: user1PvtKey,
            walletClientName: "cruxdev",
            cacheStorage: new InMemStorage(),
        });
        const cruxServiceClient = new CruxServiceClient({
            cruxId: CruxId.fromString(this.user2CruxId),
            keyManager: this.user2KeyManager
        }, this.secureCruxNetwork2, keyManagementProtocol);

        const remoteWalletClient = await cruxServiceClient.getWalletClientForUser(this.user1Data.cruxID);
        const addressMap = await remoteWalletClient.getAddressMap();
        console.log("TESTCASE::Get Address Map: ", addressMap);
    });

    it('Send Receive - CruxWalletClient<->CruxServiceClient - putAddressMap', async function() {
        const cruxWalletClient = new CruxWalletClient({
            privateKey: user1PvtKey,
            walletClientName: "cruxdev",
            cacheStorage: new InMemStorage(),
        });
        const cruxServiceClient = new CruxServiceClient({
            cruxId: CruxId.fromString(this.user2CruxId),
            keyManager: this.user2KeyManager
        }, this.secureCruxNetwork2, keyManagementProtocol);
        const remoteWalletClient = await cruxServiceClient.getWalletClientForUser(this.user1Data.cruxID);
        const addressMapResult = await remoteWalletClient.putAddressMap({
            "ltc": {
                addressHash: "1HX4KvtPdg9QUYwQE1kNqTAjmNaDG12346"
            }
        });
        console.log("TESTCASE::Put Address Map: ", addressMapResult);
    });
});