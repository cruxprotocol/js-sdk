import * as chai from "chai";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import 'mocha';
import {SecureCruxNetwork, CertificateManager, CruxProtocolMessenger} from "../../core/domain-services";
import {ICruxUserRepository, IProtocolMessage, IPubSubClientFactory} from "../../core/interfaces";
import {BasicKeyManager, cruxPaymentProtocol, keyManagementProtocol} from "../../infrastructure/implementations";
import {CruxId} from "../../packages";
import {InMemoryCruxUserRepository, MockUserStore, patchMissingDependencies} from "../test-utils";
import {InMemoryPubSubClientFactory, InMemoryMaliciousPubSubClientFactory} from "./inmemory-implementations";
import {getMockUserBar123CSTestWallet, getMockUserFoo123CSTestWallet, getMockUserFooBar123CSTestWallet} from "./utils";

patchMissingDependencies();

chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;



describe('Test Key Management Protocol', function() {
    beforeEach(async function() {
        const userStore = new MockUserStore();
        const user1Data = getMockUserFoo123CSTestWallet();
        const user2Data = getMockUserBar123CSTestWallet();
        const user3Data = getMockUserFooBar123CSTestWallet();
        this.user1Data = user1Data;
        this.user2Data = user2Data;
        this.user3Data = user3Data;
        userStore.store(user1Data.cruxUser);
        userStore.store(user2Data.cruxUser);
        const inmemUserRepo = new InMemoryCruxUserRepository(userStore);
        const pubsubClientFactory = new InMemoryPubSubClientFactory();
        const user1Messenger = new SecureCruxNetwork(inmemUserRepo, pubsubClientFactory, {
            cruxId: this.user1Data.cruxUser.cruxID,
            keyManager: new BasicKeyManager(this.user1Data.pvtKey)
        });
        const user2Messenger = new SecureCruxNetwork(inmemUserRepo, pubsubClientFactory, {
            cruxId: this.user2Data.cruxUser.cruxID,
            keyManager: new BasicKeyManager(this.user2Data.pvtKey)
        });
        await user1Messenger.initialize();
        await user2Messenger.initialize();
        this.user1KeyManagerProtocolMessenger = new CruxProtocolMessenger(user1Messenger, keyManagementProtocol);
        this.user2KeyManagerProtocolMessenger = new CruxProtocolMessenger(user2Messenger, keyManagementProtocol);

    });

    describe('Test Key Management Protocol - (Request)', function() {
        it('Valid Key Manager Request - Get Public Key', async function() {
            return new Promise(async (res, rej) => {
                const validKeyManagerRequest = {
                    args: [],
                    invocationId: '7c3baa3c-f5e8-490a-88a1-e0a052b7caa4',
                    method: "getPubKey"
                }
                const testMessage: IProtocolMessage = {
                    type: "KEY_MANAGER_REQUEST",
                    content: validKeyManagerRequest
                }
                const that = this;
                this.user2KeyManagerProtocolMessenger.on('KEY_MANAGER_REQUEST', async (msg: any, senderId?: CruxId)=>{
                    try {
                        expect(msg).to.deep.equal(validKeyManagerRequest);
                        expect(senderId!.toString()).equals(that.user1Data.cruxUser.cruxID.toString());
                    } catch (e) {
                        rej(e)
                    }
                    res()
                }, (err: any)=>{
                    rej(err)
                });
                await this.user1KeyManagerProtocolMessenger.send(testMessage, this.user2Data.cruxUser.cruxID)
            });
        });
        it('Valid Key Manager Request - Sign Web Token', async function() {
            return new Promise(async (res, rej) => {
                const validKeyManagerRequest = {
                    args: ['webtoken'],
                    invocationId: '7c3baa3c-f5e8-490a-88a1-e0a052b7caa4',
                    method: "signWebToken"
                }
                const testMessage: IProtocolMessage = {
                    type: "KEY_MANAGER_REQUEST",
                    content: validKeyManagerRequest
                }
                const that = this;
                this.user2KeyManagerProtocolMessenger.on('KEY_MANAGER_REQUEST', async (msg: any, senderId?: CruxId)=>{
                    try {
                        expect(msg).to.deep.equal(validKeyManagerRequest);
                        expect(senderId!.toString()).equals(that.user1Data.cruxUser.cruxID.toString());
                    } catch (e) {
                        rej(e)
                    }
                    res()
                }, (err: any)=>{
                    rej(err)
                });
                await this.user1KeyManagerProtocolMessenger.send(testMessage, this.user2Data.cruxUser.cruxID)
            });
        });
        it('Valid Key Manager Request - Derive Shared Secret', async function() {
            const testPubKey = "03e6bbc79879d37473836771441a79d3d9dddfabacdac22ed315e5636ff819a318";
            return new Promise(async (res, rej) => {
                const validKeyManagerRequest = {
                    args: [testPubKey],
                    invocationId: '7c3baa3c-f5e8-490a-88a1-e0a052b7caa4',
                    method: "deriveSharedSecret"
                }
                const testMessage: IProtocolMessage = {
                    type: "KEY_MANAGER_REQUEST",
                    content: validKeyManagerRequest
                }
                const that = this;
                this.user2KeyManagerProtocolMessenger.on('KEY_MANAGER_REQUEST', async (msg: any, senderId?: CruxId)=>{
                    try {
                        expect(msg).to.deep.equal(validKeyManagerRequest);
                        expect(senderId!.toString()).equals(that.user1Data.cruxUser.cruxID.toString());
                    } catch (e) {
                        rej(e)
                    }
                    res()
                }, (err: any)=>{
                    rej(err)
                });
                await this.user1KeyManagerProtocolMessenger.send(testMessage, this.user2Data.cruxUser.cruxID)
            });
        });
        it('Valid Key Manager Request - Decrypt Message', async function() {
            const testEncryptedMessage = "4b4f34746f434c30354349312b41314b554f644542773d3d"
            return new Promise(async (res, rej) => {
                const validKeyManagerRequest = {
                    args: [testEncryptedMessage],
                    invocationId: '7c3baa3c-f5e8-490a-88a1-e0a052b7caa4',
                    method: "decryptMessage"
                }
                const testMessage: IProtocolMessage = {
                    type: "KEY_MANAGER_REQUEST",
                    content: validKeyManagerRequest
                }
                const that = this;
                this.user2KeyManagerProtocolMessenger.on('KEY_MANAGER_REQUEST', async (msg: any, senderId?: CruxId)=>{
                    try {
                        expect(msg).to.deep.equal(validKeyManagerRequest);
                        expect(senderId!.toString()).equals(that.user1Data.cruxUser.cruxID.toString());
                    } catch (e) {
                        rej(e)
                    }
                    res()
                }, (err: any)=>{
                    rej(err)
                });
                await this.user1KeyManagerProtocolMessenger.send(testMessage, this.user2Data.cruxUser.cruxID)
            });
        });
        it('Invalid Key Manager Request - Wrong method', async function() {
            const invalidKeyManagerRequest = {
                args: ['token'],
                invocationId: '7c3baa3c-f5e8-490a-88a1-e0a052b7caa4',
                method: "getPublicKey"
            }
            const testMessage: IProtocolMessage = {
                type: "KEY_MANAGER_REQUEST",
                content: invalidKeyManagerRequest
            }
            const promise = this.user1KeyManagerProtocolMessenger.send(testMessage, this.user2Data.cruxUser.cruxID);
            return expect(promise).to.be.eventually.rejected;
        });
    });
    
    describe('Test Key Management Protocol - (Response)', function() {
        it('Valid Key Manager Response - String output', async function() {
            return new Promise(async (res, rej) => {
                const validKeyManagerResponse = {
                    result: "03e6bbc79879d37473836771441a79d3d9dddfabacdac22ed315e5636ff819a318",
                    invocationId: '7c3baa3c-f5e8-490a-88a1-e0a052b7caa4',
                }
                const testMessage: IProtocolMessage = {
                    type: "KEY_MANAGER_RESPONSE",
                    content: validKeyManagerResponse
                }
                const that = this;
                this.user2KeyManagerProtocolMessenger.on('KEY_MANAGER_RESPONSE', async (msg: any, senderId?: CruxId)=>{
                    try {
                        expect(msg).to.deep.equal(validKeyManagerResponse);
                        expect(senderId!.toString()).equals(that.user1Data.cruxUser.cruxID.toString());
                    } catch (e) {
                        rej(e)
                    }
                    res()
                }, (err: any)=>{
                    rej(err)
                });
                await this.user1KeyManagerProtocolMessenger.send(testMessage, this.user2Data.cruxUser.cruxID)
            });
        });
        it('Valid Key Manager Response - Object Output', async function() {
            return new Promise(async (res, rej) => {
                const validKeyManagerResponse = {
                    result: [{
                        'webtoken': "hello"
                    }],
                    invocationId: '7c3baa3c-f5e8-490a-88a1-e0a052b7caa4'
                }
                const testMessage: IProtocolMessage = {
                    type: "KEY_MANAGER_RESPONSE",
                    content: validKeyManagerResponse
                }
                const that = this;
                this.user2KeyManagerProtocolMessenger.on('KEY_MANAGER_RESPONSE', async (msg: any, senderId?: CruxId)=>{
                    try {
                        expect(msg).to.deep.equal(validKeyManagerResponse);
                        expect(senderId!.toString()).equals(that.user1Data.cruxUser.cruxID.toString());
                    } catch (e) {
                        rej(e)
                    }
                    res()
                }, (err: any)=>{
                    rej(err)
                });
                await this.user1KeyManagerProtocolMessenger.send(testMessage, this.user2Data.cruxUser.cruxID)
            });
        });
        it('Valid Key Manager Response - Array Output', async function() {
            return new Promise(async (res, rej) => {
                const validKeyManagerResponse = {
                    result: ['webtoken'],
                    invocationId: '7c3baa3c-f5e8-490a-88a1-e0a052b7caa4'
                }
                const testMessage: IProtocolMessage = {
                    type: "KEY_MANAGER_RESPONSE",
                    content: validKeyManagerResponse
                }
                const that = this;
                this.user2KeyManagerProtocolMessenger.on('KEY_MANAGER_RESPONSE', async (msg: any, senderId?: CruxId)=>{
                    try {
                        expect(msg).to.deep.equal(validKeyManagerResponse);
                        expect(senderId!.toString()).equals(that.user1Data.cruxUser.cruxID.toString());
                    } catch (e) {
                        rej(e)
                    }
                    res()
                }, (err: any)=>{
                    rej(err)
                });
                await this.user1KeyManagerProtocolMessenger.send(testMessage, this.user2Data.cruxUser.cruxID)
            });
        });

        it('Invalid Key Manager Response - Missing data', async function() {
            const validKeyManagerResponse = {
                invocationId: '7c3baa3c-f5e8-490a-88a1-e0a052b7caa4'
            }
            const testMessage: IProtocolMessage = {
                type: "KEY_MANAGER_RESPONSE",
                content: validKeyManagerResponse
            }
            const promise = this.user1KeyManagerProtocolMessenger.send(testMessage, this.user2Data.cruxUser.cruxID);
            return expect(promise).to.be.eventually.rejected;
        });
        it('Invalid Key Manager Response - invocationId wrong length', async function() {
            const validKeyManagerResponse = {
                result: ['webtoken'],
                invocationId: '7c3baa3c-f5e8-490a-88a1-e0a02b7caa4'
            }
            const testMessage: IProtocolMessage = {
                type: "KEY_MANAGER_RESPONSE",
                content: validKeyManagerResponse
            }
            const promise = this.user1KeyManagerProtocolMessenger.send(testMessage, this.user2Data.cruxUser.cruxID);
            return expect(promise).to.be.eventually.rejected;
        });
    });

})
