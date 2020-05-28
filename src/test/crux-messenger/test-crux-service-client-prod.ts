import * as chai from "chai";
import * as blockstack from "blockstack";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import 'mocha';
import {SecureCruxIdMessenger} from "../../core/domain-services";
import {CruxServiceClient, getCruxUserRepository, CruxWalletClient} from "../../application/clients"
import {BasicKeyManager, CruxNetPubSubClientFactory, StrongPubSubClient} from "../../infrastructure/implementations";
import {patchMissingDependencies, getCruxdevCruxDomain} from "../test-utils";
import { CruxSpec, IAddress } from "../../core/entities";
import { CruxId, InMemStorage } from "../../packages";
import { bip32 } from "bitcoinjs-lib";
import * as bip39 from "bip39";

patchMissingDependencies();

chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;

const btcAddress: IAddress = {addressHash: "1HX4KvtPdg9QUYwQE1kNqTAjmNaDG7w82V"};
const user1PvtKey = "cdf2d276caf0c9c34258ed6ebd0e60e0e8b3d9a7b8a9a717f2e19ed9b37f7c6f"; // mascot6699@cruxdex.crux
const user2PvtKey = "KyBuSe1MMV6NjJgZfyWuvgmxUeAYswLC2HrfYLUri9aP3AS5FBfr"; // release020@cruxdev.crux


const _generateMnemonic = (): string => {
    return blockstack.BlockstackWallet.generateMnemonic();
}

const _generateIdentityKeyPair = async (mnemonic: string): Promise<any> => {
    const wallet = new blockstack.BlockstackWallet(bip32.fromSeed(bip39.mnemonicToSeedSync(mnemonic)));
    const { address, key, keyID} = wallet.getIdentityKeyPair(0);
    const identityKeyPair: any = {
        address,
        privKey: key,
        pubKey: keyID,
    };
    return identityKeyPair;
}

describe('Test CruxServiceClient', function() {
    beforeEach(async function() {
        const HOST = "127.0.0.1";
        const PORT = 1883;
        const newMnemonic = _generateMnemonic();
        const identityKeyPair = await _generateIdentityKeyPair(newMnemonic);
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
    it('Basic Key Manager Send Receive - CruxServiceClient', async function() {
        const cruxWalletClient = new CruxWalletClient({
            privateKey: user1PvtKey,
            walletClientName: "cruxdev",
            isHost: true,
            cacheStorage: new InMemStorage(),
        });
        const cruxServiceClient = new CruxServiceClient();
        const serviceWalletClient = cruxServiceClient.getWalletClientForUser(new SecureCruxIdMessenger(this.userRepo, this.pubsubClientFactory, {
            cruxId: CruxId.fromString(this.user2CruxId),
            keyManager: this.user2KeyManager
        }), this.user1Data.cruxID);
        const addressMap = await serviceWalletClient.putAddressMap({"btc" : btcAddress});
        console.log("TESTCASE::Address Map: ", addressMap);
    });
});