import * as chai from "chai";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import 'mocha';
import {SecureCruxIdMessenger, CertificateManager, CruxProtocolMessenger} from "../../core/domain-services";
import {ICruxUserRepository, IProtocolMessage, IPubSubClientFactory} from "../../core/interfaces";
import {BasicKeyManager, cruxPaymentProtocol} from "../../infrastructure/implementations";
import {InMemoryCruxUserRepository, MockUserStore, patchMissingDependencies} from "../test-utils";
import {InMemoryPubSubClientFactory, InMemoryMaliciousPubSubClientFactory} from "./inmemory-implementations";
import {getMockUserBar123CSTestWallet, getMockUserFoo123CSTestWallet, getMockUserFooBar123CSTestWallet} from "./utils";

patchMissingDependencies();

chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;


const messageSchemaByType: any = cruxPaymentProtocol.reduce((newObj, x) => Object.assign(newObj, {[x.messageType]: x.schema}), {});

describe('Test Payments Protocol', function() {

    describe('type PAYMENT_REQUEST tests', function() {
        beforeEach(function() {
            this.messageSchema = messageSchemaByType['PAYMENT_REQUEST']
        })
        it('Valid messages', async function() {
            const validPaymentRequests = [{
                amount: '1',
                assetId: '7c3baa3c-f5e8-490a-88a1-e0a052b7caa4',
                toAddress: { addressHash: 'FOOBTCADDRESSS' }
            },{
                amount: '1',
                assetId: '7c3baa3c-f5e8-490a-88a1-e0a052b7caa4',
                toAddress: { addressHash: 'FOOBTCADDRESSS', secIdentifier: '1234' }
            }];
            for (let msg of validPaymentRequests) {
                const result = this.messageSchema.validate(msg)
                console.log(result);
                expect(result.error).to.be.undefined;
            }
        });

        it('Invalid Messages', async function() {
            const invalidPaymentRequests = [{},{
                amount: '1',
                assetId: '7c3baa3c-f5e8-490a-88a1-e0a052b7caa4',
                toAddress: { addressHash: 'FOOBTCADDRESSS' },
                random: 'yo'
            },{
                amount: '1',
                assetId: '7c3baa3c-f5e8-490a-88a1-e0a052b7caa4',
                toAddress:{ addressHash: 'FOOBTCADDRESSS', random: 'yo'}
            },{
                amount: '1',
                assetId: '7c3baa3c-f5e8-490a-88a1-e0a052b7caa4',
                toAddress: 'FOOBTCADDRESSS'
            },{
                amount: 1,
                assetId: '7c3baa3c-f5e8-490a-88a1-e0a052b7caa4',
                toAddress: { addressHash: 'FOOBTCADDRESSS' }
            },{
                amount: '1',
                assetId: '7c3baa3c-f5e8-490a-88a1-e0a4',
                toAddress: { addressHash: 'FOOBTCADDRESSS' }
            },{
                amount: '1',
                assetId: '7c3baa3c-f5e8-490a-88a1-e0a052b7caa4',
                toAddress: 12345
            },{
                assetId: '7c3baa3c-f5e8-490a-88a1-e0a052b7caa4',
                toAddress: { addressHash: 'FOOBTCADDRESSS' }
            },{
                amount: '1',
                toAddress: { addressHash: 'FOOBTCADDRESSS' }
            },{
                amount: '1',
                assetId: '7c3baa3c-f5e8-490a-88a1-e0a052b7caa4',
            }];
            for (let msg of invalidPaymentRequests) {
                const result = this.messageSchema.validate(msg);
                console.log(result)
                expect(result.error).to.not.be.undefined;
            }

        });

    });



})
