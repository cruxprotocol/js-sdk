import { expect } from 'chai';
import sinon from "sinon";
import 'mocha';
import { BasicKeyManager } from '../../infrastructure/implementations/basic-key-manager';
import { CruxSpec } from '../../core/entities/crux-spec';
import { GaiaService } from '../../infrastructure/services/gaia-service';
import * as utils from "../../packages/utils";
import WebCrypto from "node-webcrypto-ossl";
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
    let httpJSONRequestStub: sinon.SinonStub;
    before(() => { sandbox = sinon.createSandbox(); })
    beforeEach(() => {
        httpJSONRequestStub = sandbox.stub(utils, 'httpJSONRequest').throws('unhandled in mocks');
    })
    afterEach(() => { sandbox.restore(); })
    describe('Testing GaiaService', () => {
        let gaiaService: GaiaService;
        const gaiaServiceRequestMocks = [
            {
                request: {
                    baseUrl: "https://hub.cruxpay.com",
                    url: "/hub_info"
                },
                response: {
                    "challenge_text": "[\"gaiahub\",\"0\",\"hub.cruxpay.com\",\"blockstack_storage_please_sign\"]",
                    "latest_auth_version": "v1",
                    "max_file_upload_size_megabytes": 20,
                    "read_url_prefix": "https://gaia.cruxpay.com/"
                }
            },
            {
                request: { 
                    "baseUrl": "https://hub.cruxpay.com", 
                    "body": sinon.match.any, 
                    "headers": { 
                        "Authorization": sinon.match(new RegExp("bearer (.+)")),
                        "Content-Type": "application/json" 
                    },
                    "method": "POST", 
                    "url": "/store/1HkXFmLCg4zmPZyf2W5hbpV79EHwG52cEA/cruxdev_cruxpay.json",
                },
                response: {
                    publicURL: "https://gaia.cruxpay.com/1HkXFmLCg4zmPZyf2W5hbpV79EHwG52cEA/cruxdev_cruxpay.json"
                }
            }
        ]
        beforeEach(() => {
            gaiaService = new GaiaService(CruxSpec.blockstack.infrastructure.gaiaHub);
            gaiaServiceRequestMocks.forEach(requestObj => {
                httpJSONRequestStub.withArgs(requestObj.request).returns(requestObj.response)
            })
        })
        it('uploading cruxpay.json', async () => {
            // inputs
            const fileName = "cruxdev_cruxpay.json";
            const content = { "d78c26f8-7c13-4909-bf62-57d7623f8ee8": { "addressHash": "1HX4KvtPdg9QUYwQE1kNqTAjmNaDG7w82V" }, "4e4d9982-3469-421b-ab60-2c0c2f05386a": { "addressHash": "0x0a2311594059b468c9897338b027c8782398b481" } };
            const keyManager = new BasicKeyManager("cdf2d276caf0c9c34258ed6ebd0e60e0e8b3d9a7b8a9a717f2e19ed9b37f7c6f");
            // calling the method
            const url = await gaiaService.uploadContentToGaiaHub(fileName, content, keyManager);
            // run expectations
            const expectedURL = "https://gaia.cruxpay.com/1HkXFmLCg4zmPZyf2W5hbpV79EHwG52cEA/cruxdev_cruxpay.json";
            const requestArguments = gaiaServiceRequestMocks.map((fixture) => fixture.request);
            expect(url).to.be.equal(expectedURL);
            expect(httpJSONRequestStub.calledTwice).to.be.true;
            expect(httpJSONRequestStub.calledWith(requestArguments[0])).to.be.true;
            expect(httpJSONRequestStub.calledWith(requestArguments[1])).to.be.true;
        })
    })
    describe('Testing BlockstackService', () => {
    })
    describe('Testing BlockstackSubdomainRegistrarApiClient', () => {
    })
});
