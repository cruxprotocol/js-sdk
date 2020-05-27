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

const user1PvtKey = "cdf2d276caf0c9c34258ed6ebd0e60e0e8b3d9a7b8a9a717f2e19ed9b37f7c6f"; // mascot6699@cruxdex.crux
const user2PvtKey = "KyBuSe1MMV6NjJgZfyWuvgmxUeAYswLC2HrfYLUri9aP3AS5FBfr"; // release020@cruxdev.crux

describe('Test RemoteKeyClient - PROD', function() {
    beforeEach(async function() {
        const HOST = "127.0.0.1";
        const PORT = 1883;
        const newMnemonic = _generateMnemonic();
        const identityKeyPair = await _generateIdentityKeyPair(newMnemonic);
        console.log("+++++()()()", identityKeyPair, identityKeyPair.privKey);
        // const keyPair = curve.genKeyPair();
        // console.log(keyPair.getPublic('hex'));
        this.user2CruxId = "release020@cruxdev.crux";
        this.user1KeyManager = new BasicKeyManager(user1PvtKey);
        console.log("!!!", this.user1KeyManager);
        this.user2KeyManager = new BasicKeyManager(user2PvtKey);
        console.log("===", this.user2KeyManager);
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
        const testPubKey = "03e6bbc79879d37473836771441a79d3d9dddfabacdac22ed315e5636ff819a318";
        return new Promise(async (resolve, reject) => {
            const remoteKeyManager = new RemoteKeyManager(new SecureCruxIdMessenger(this.userRepo, this.pubsubClientFactory, {
                cruxId: this.user2Data.cruxID,
                keyManager: this.user2KeyManager
            }), this.user1Data.cruxID);

            const remoteKeyHost = new RemoteKeyHost(new SecureCruxIdMessenger(this.userRepo, this.pubsubClientFactory, {
                cruxId: this.user1Data.cruxID,
                keyManager: this.user1KeyManager
            }), this.user1KeyManager);

            remoteKeyHost.invocationListener((msg, senderId) => {
                new Promise(async (resolve, reject) => {
                    console.log("&^%$#%^&*&^%$", msg);
                    const data = await remoteKeyHost.handleMessage(msg);
                    console.log("+++^^^&^^", data);
                    remoteKeyHost.sendInvocationResult(data, senderId);
                    resolve();
                });
            },(err) => {
            });
            const signedWebToken = await remoteKeyManager.signWebToken("1234567")
            console.log(signedWebToken);
            expect(signedWebToken).to.have.length(138);
            const publicKey = await remoteKeyManager.getPubKey();
            console.log(publicKey);
            // expect(publicKey).to.equals(testPubKey);
            const sharedSecret = await remoteKeyManager.deriveSharedSecret(testPubKey)
            console.log(sharedSecret);
            // expect(sharedSecret).to.equals("3380b4752c9cebf96bc55491ef0ee67ae1d564c0bb931a0c6e8875be6e3bee5");
            // const decryptedMessage = await remoteKeyManager.decryptMessage("4b4f34746f434c30354349312b41314b554f644542773d3d");
            // console.log(decryptedMessage);
            // expect(decryptedMessage).to.equals("");
            resolve();
        });
    });
})
