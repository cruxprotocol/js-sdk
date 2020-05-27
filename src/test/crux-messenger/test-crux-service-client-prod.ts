import * as chai from "chai";
import * as blockstack from "blockstack";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import 'mocha';
import * as elliptic from "elliptic";
import Client from "strong-pubsub";
import MqttAdapter from "strong-pubsub-mqtt";
import {SecureCruxIdMessenger, RemoteKeyClient, RemoteKeyHost, RemoteKeyManager} from "../../core/domain-services";
import {CruxServiceClient, getCruxUserRepository, CruxWalletClient} from "../../application/clients"
import {BasicKeyManager, CruxNetPubSubClientFactory, StrongPubSubClient} from "../../infrastructure/implementations";
import {patchMissingDependencies, getCruxdevCruxDomain} from "../test-utils";
import { CruxSpec } from "../../core/entities";
import {IKeyManager} from "../../core/interfaces";
import { CruxId } from "../../packages";
import { bip32 } from "bitcoinjs-lib";
import * as bip39 from "bip39";

patchMissingDependencies();

chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;

const user1PvtKey = "cdf2d276caf0c9c34258ed6ebd0e60e0e8b3d9a7b8a9a717f2e19ed9b37f7c6f"; // mascot6699@cruxdex.crux
// const user2PvtKey = "KyBuSe1MMV6NjJgZfyWuvgmxUeAYswLC2HrfYLUri9aP3AS5FBfr"; // release020@cruxdev.crux

var EC = elliptic.ec;
const curve = new EC("secp256k1");

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
        console.log("+++++()()()", identityKeyPair);
        // const keyPair = curve.genKeyPair();
        // console.log(keyPair.getPublic('hex'));
        this.user2CruxId = "release020@cruxdev.crux";
        this.user1KeyManager = new BasicKeyManager(user1PvtKey);
        console.log("!!!", this.user1KeyManager);
        this.user2KeyManager = new BasicKeyManager(identityKeyPair.privKey);
        console.log("===", this.user2KeyManager);
        this.userRepo = getCruxUserRepository({
            blockstackInfrastructure: CruxSpec.blockstack.infrastructure,
            cruxDomain: getCruxdevCruxDomain()
        });
        this.user1Data = await this.userRepo.getWithKey(this.user1KeyManager);
        this.pubsubClientFactory = new CruxNetPubSubClientFactory({
            defaultLinkServer: {
                host: HOST,
                port: PORT,
            }
        });
        this.subscriberUserName = "release020@cruxdev.crux";
        this.subscriberConfig = {
            clientOptions: {
                host: HOST,
                port: PORT,
                mqtt: {
                    clean: false,
                    clientId: this.subscriberUserName,
                },
            },
            subscribeOptions: {
                qos: 2,
            }
        };
        this.subscriber = new StrongPubSubClient(this.subscriberConfig);
        this.client = new Client(this.subscriberConfig.clientOptions, MqttAdapter);
    });
    it('Basic Key Manager Send Receive - CruxServiceClient', async function() {
        const cruxWalletClient = new CruxWalletClient({
            privateKey: user1PvtKey,
            walletClientName: "cruxdev",
            isHost: true,
        });
        // const user1Messenger = new SecureCruxIdMessenger(this.userRepo, this.pubsubClientFactory, {
        //     cruxId: this.user1Data.cruxID,
        //     keyManager: new BasicKeyManager(user1PvtKey)
        // });
        // new Promise(async (resolve, reject) => {
        //     this.client.subscribe("topic_mascot6699@cruxdev.crux", this.subscriberConfig.subscribeOptions);
        //     this.client.on("message", (topic, msg) => {
        //         console.log("--------------", topic, msg)
        //         resolve();
        //     });
        // });
        const cruxServiceClient = new CruxServiceClient();
        const serviceWalletClient = cruxServiceClient.getWalletClientForUser(new SecureCruxIdMessenger(this.userRepo, this.pubsubClientFactory, {
            cruxId: CruxId.fromString(this.user2CruxId),
            keyManager: this.user2KeyManager
        }), this.user1Data.cruxID);
        console.log("++++++$$#####", serviceWalletClient);
        console.log("=======++++++++", await serviceWalletClient.getAddressMap());
        console.log("@@@@@");
    });
});