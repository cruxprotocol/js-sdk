import * as chai from "chai";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import 'mocha';
import {SecureCruxIdMessenger, CertificateManager, CruxConnectProtocolMessenger} from "../../core/domain-services";
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
                toAddress: 'fooaddress123'
            }];
            for (let msg of validPaymentRequests) {
                this.messageSchema.validate(msg)
            }
        });

        it('Invalid Messages', async function() {
            const validPaymentRequests = [{},{
                amount: 1,
                assetId: '7c3baa3c-f5e8-490a-88a1-e0a052b7caa4',
                toAddress: 'fooaddress123'
            },{
                amount: '1',
                assetId: '7c3baa3c-f5e8-490a-88a1-e0a4',
                toAddress: 'fooaddress123'
            },{
                amount: '1',
                assetId: '7c3baa3c-f5e8-490a-88a1-e0a052b7caa4',
                toAddress: 12345
            },{
                assetId: '7c3baa3c-f5e8-490a-88a1-e0a052b7caa4',
                toAddress: 'fooaddress123'
            },{
                amount: '1',
                toAddress: 'fooaddress123'
            },{
                amount: '1',
                assetId: '7c3baa3c-f5e8-490a-88a1-e0a052b7caa4',
            }];
            for (let msg of validPaymentRequests) {
                const result = this.messageSchema.validate(msg);
                console.log("Testing ", msg)
                expect(result.error).to.not.be.undefined;
            }

        });

    });



})
