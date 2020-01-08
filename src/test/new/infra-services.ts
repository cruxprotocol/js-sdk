import { expect } from 'chai';
import sinon from "sinon";
import 'mocha';
import { BasicKeyManager } from '../../infrastructure/implementations/basic-key-manager';
import { CruxSpec } from '../../core/entities/crux-spec';
import { GaiaService } from '../../infrastructure/services/gaia-service';
import WebCrypto from "node-webcrypto-ossl";
import * as apiClients from '../../infrastructure/services/api-clients';
import { BlockstackService } from '../../infrastructure/services/blockstack-service';
import { DomainRegistrationStatus } from '../../core/entities/crux-domain';
interface Global {
    crypto: any;
    TextEncoder: any;
    TextDecoder: any;
}
declare const global: Global;

const crypto = new WebCrypto();
let util = require('util')
global.crypto = crypto
global.TextEncoder = util.TextEncoder
global.TextDecoder = util.TextDecoder

describe('Infrastructure Services Test', () => {
    let sandbox: sinon.SinonSandbox;
    before(() => { sandbox = sinon.createSandbox(); })
    afterEach(() => { sandbox.restore(); })
    describe('Testing GaiaService', () => {
        let gaiaService: GaiaService;
        let mockGaiaServiceApiClient;
        beforeEach(() => {
            mockGaiaServiceApiClient =  {
                getHubInfo: sandbox.stub().resolves({
                    "challenge_text": "[\"gaiahub\",\"0\",\"hub.cruxpay.com\",\"blockstack_storage_please_sign\"]",
                    "latest_auth_version": "v1",
                    "max_file_upload_size_megabytes": 20,
                    "read_url_prefix": "https://gaia.cruxpay.com/"
                }),
            }
            sandbox.stub(apiClients, 'GaiaServiceApiClient').returns(mockGaiaServiceApiClient);
            gaiaService = new GaiaService(CruxSpec.blockstack.infrastructure.gaiaHub);
        })
        it('uploading cruxpay.json', async () => {
            // inputs
            const fileName = "cruxdev_cruxpay.json";
            const content = { "d78c26f8-7c13-4909-bf62-57d7623f8ee8": { "addressHash": "1HX4KvtPdg9QUYwQE1kNqTAjmNaDG7w82V" }, "4e4d9982-3469-421b-ab60-2c0c2f05386a": { "addressHash": "0x0a2311594059b468c9897338b027c8782398b481" } };
            const keyManager = new BasicKeyManager("d4a7eab17471d190a0d6cfa00546dceeac88f333b8a2d16fb4464e1e57ac188f");     // random-private-key;
            
            // mocks
            const cruxpayURL = "https://gaia.cruxpay.com/16wXkSf8kwFGz3oGbHW2aofHuBLX6MWgeh/cruxdev_cruxpay.json";
            mockGaiaServiceApiClient['store'] = sinon.stub().resolves({publicURL: cruxpayURL});
            
            // calling the method
            const url = await gaiaService.uploadContentToGaiaHub(fileName, content, keyManager);
            
            // run expectations
            const filename = "cruxdev_cruxpay.json";
            const hubConfig = {
                address: "16wXkSf8kwFGz3oGbHW2aofHuBLX6MWgeh",
                token: sinon.match(new RegExp(`v1:(.+)`)),
            };
            const contents = sinon.match.any;
            const contentType = "application/json";
            expect(url).to.be.equal(cruxpayURL);
            expect(mockGaiaServiceApiClient.getHubInfo.calledOnce).to.be.true;
            expect(mockGaiaServiceApiClient.store.calledOnceWith(filename, hubConfig.address, hubConfig.token, contents, contentType)).to.be.true;
        })
    })
    describe('Testing BlockstackService', () => {
        let mockBlockstackNamingServiceApiClient;
        let mockBlockstackSubdomainRegistrarApiClient;
        let blockstackService: BlockstackService;
        beforeEach(() => {
            mockBlockstackNamingServiceApiClient = {};
            mockBlockstackSubdomainRegistrarApiClient = {};
            sandbox.stub(apiClients, 'BlockstackNamingServiceApiClient').returns(mockBlockstackNamingServiceApiClient);
            sandbox.stub(apiClients, 'BlockstackSubdomainRegistrarApiClient').returns(mockBlockstackSubdomainRegistrarApiClient);
            blockstackService = new BlockstackService({
                infrastructure: CruxSpec.blockstack.infrastructure,
            });
        })
        describe('getDomainRegistrationStatus', () => {
            it('"cruxdev" should be REGISTERED', async () => {
                const domainAvailability = await blockstackService.getDomainRegistrationStatus("cruxdev");
                expect(domainAvailability).to.be.equal(DomainRegistrationStatus.REGISTERED);
            }) 
            it('"testcase" should be AVAILABLE', async () => {}) 
        })
    })
    describe('Testing BlockstackSubdomainRegistrarApiClient', () => {
    })
    describe('Testing BlockstackNamingServiceApiClient', () => {
    })
});