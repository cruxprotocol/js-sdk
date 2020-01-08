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
        let staticMocksGaiaServiceApiClient;
        // fixtures
        const cruxpayGaiaHub = "https://hub.cruxpay.com"
        beforeEach(() => {
            // mocking the static methods
            staticMocksGaiaServiceApiClient = {
                getHubInfo: sandbox.stub(apiClients.GaiaServiceApiClient, 'getHubInfo').throws("unhandled in mocks"),
                retrieve: sandbox.stub(apiClients.GaiaServiceApiClient, 'retrieve').throws("unhandled in mocks"),
                store: sandbox.stub(apiClients.GaiaServiceApiClient, 'store').throws("unhandled in mocks"),
            }
            staticMocksGaiaServiceApiClient.getHubInfo.withArgs(cruxpayGaiaHub).resolves({
                "challenge_text": "[\"gaiahub\",\"0\",\"hub.cruxpay.com\",\"blockstack_storage_please_sign\"]",
                "latest_auth_version": "v1",
                "max_file_upload_size_megabytes": 20,
                "read_url_prefix": "https://gaia.cruxpay.com/"
            })
            // mocking the public methods
            mockGaiaServiceApiClient = {}
            sandbox.stub(apiClients, 'GaiaServiceApiClient').returns(mockGaiaServiceApiClient);
            gaiaService = new GaiaService(CruxSpec.blockstack.infrastructure.gaiaHub);
        })
        it('uploading cruxpay.json', async () => {
            // inputs
            const fileName = "cruxdev_cruxpay.json";
            const content = { "d78c26f8-7c13-4909-bf62-57d7623f8ee8": { "addressHash": "1HX4KvtPdg9QUYwQE1kNqTAjmNaDG7w82V" }, "4e4d9982-3469-421b-ab60-2c0c2f05386a": { "addressHash": "0x0a2311594059b468c9897338b027c8782398b481" } };
            const keyManager = new BasicKeyManager("d4a7eab17471d190a0d6cfa00546dceeac88f333b8a2d16fb4464e1e57ac188f");     // random-private-key;
            
            // mocks
            const hubConfig = {
                address: "16wXkSf8kwFGz3oGbHW2aofHuBLX6MWgeh",
                token: sinon.match(new RegExp(`v1:(.+)`)),
            };
            const contents = sinon.match.any;
            const contentType = "application/json";
            const cruxpayURL = "https://gaia.cruxpay.com/16wXkSf8kwFGz3oGbHW2aofHuBLX6MWgeh/cruxdev_cruxpay.json";
            staticMocksGaiaServiceApiClient.store
                .withArgs(cruxpayGaiaHub, fileName, hubConfig.address, hubConfig.token, contents, contentType)
                .resolves({publicURL: cruxpayURL});
            
            // calling the method
            const url = await gaiaService.uploadContentToGaiaHub(fileName, content, keyManager);
            
            // run expectations
            expect(url).to.be.equal(cruxpayURL);
            expect(staticMocksGaiaServiceApiClient.getHubInfo.calledOnceWith(cruxpayGaiaHub)).to.be.true;
            expect(staticMocksGaiaServiceApiClient.store.calledOnceWith(cruxpayGaiaHub, fileName, hubConfig.address, hubConfig.token, contents, contentType)).to.be.true;
        })
    })
    describe('Testing BlockstackService', () => {
        let mockBlockstackNamingServiceApiClient;
        let mockBlockstackSubdomainRegistrarApiClient;
        let blockstackService: BlockstackService;
        // fixtures
        const cruxdevBlockstackIdString = "cruxdev_crux.id";
        const cruxdevDomainString = "cruxdev";
        const cruxdevNameDetail = {
            "address": "1J2CJ2Q2rMaYftnwQiSQ6rwTuq3xPBFuw3",
            "blockchain": "bitcoin",
            "did": "did:stack:v0:1J2CJ2Q2rMaYftnwQiSQ6rwTuq3xPBFuw3-0",
            "expire_block": 704132,
            "grace_period": false,
            "last_txid": "ab969b02699be6152885945cff56e2446517cbf7cde6823fe48ad7efa0e95665",
            "renewal_deadline": 709132,
            "resolver": null,
            "status": "registered",
            "zonefile": "$ORIGIN cruxdev_crux.id\n$TTL 3600\ntester93\tIN\tTXT\t\"owner=1EdQUGMKPpa4NGpJYy7s1Gb8aHhdJpTPZAA\" \"seqn=0\" \"parts=1\" \"zf0=JE9SSUdJTiB0ZXN0ZXIyCiRUVEwgMzYwMApfaHR0cHMuX3RjcCBVUkkgMTAgMSBodHRwczovL2h1Yi5jcnV4cGF5LmNvbQ==\"\ntester94\tIN\tTXT\t\"owner=1EdQUGMKPpa4NGpJYy7s1Gb8aHhdJpTPZQA\" \"seqn=0\" \"parts=1\" \"zf0=JE9SSUdJTiB0ZXN0ZXIyCiRUVEwgMzYwMApfaHR0cHMuX3RjcCBVUkkgMTAgMSBodHRwczovL2h1Yi5jcnV4cGF5LmNvbQ==\"\ntester95\tIN\tTXT\t\"owner=1EdQUGMKPpa4NGpJYy7s1Gb8aHhdJpTPAQA\" \"seqn=0\" \"parts=1\" \"zf0=JE9SSUdJTiB0ZXN0ZXIyCiRUVEwgMzYwMApfaHR0cHMuX3RjcCBVUkkgMTAgMSBodHRwczovL2h1Yi5jcnV4cGF5LmNvbQ==\"\ntester96\tIN\tTXT\t\"owner=1EdQUGMKPpa4NGpJYy7s1Gb8aHhdJpTPAQQ\" \"seqn=0\" \"parts=1\" \"zf0=JE9SSUdJTiB0ZXN0ZXIyCiRUVEwgMzYwMApfaHR0cHMuX3RjcCBVUkkgMTAgMSBodHRwczovL2h1Yi5jcnV4cGF5LmNvbQ==\"\ntester97\tIN\tTXT\t\"owner=1EdQUGMKPpa4NGpJYy7s1Gb8aHhdJpTPQQQ\" \"seqn=0\" \"parts=1\" \"zf0=JE9SSUdJTiB0ZXN0ZXIyCiRUVEwgMzYwMApfaHR0cHMuX3RjcCBVUkkgMTAgMSBodHRwczovL2h1Yi5jcnV4cGF5LmNvbQ==\"\ntester98\tIN\tTXT\t\"owner=1EdQUGMKPpa4NGpJYy7s1Gb8aHhdJpTQQQQ\" \"seqn=0\" \"parts=1\" \"zf0=JE9SSUdJTiB0ZXN0ZXIyCiRUVEwgMzYwMApfaHR0cHMuX3RjcCBVUkkgMTAgMSBodHRwczovL2h1Yi5jcnV4cGF5LmNvbQ==\"\ntester99\tIN\tTXT\t\"owner=1EdQUGMKPpa4NGpJYy7s1Gb8aHhdJpQQQQQ\" \"seqn=0\" \"parts=1\" \"zf0=JE9SSUdJTiB0ZXN0ZXIyCiRUVEwgMzYwMApfaHR0cHMuX3RjcCBVUkkgMTAgMSBodHRwczovL2h1Yi5jcnV4cGF5LmNvbQ==\"\ntester100\tIN\tTXT\t\"owner=1EdQUGMKPpa4NGpJYy7s1Gb8aHhdJpQQQSQ\" \"seqn=0\" \"parts=1\" \"zf0=JE9SSUdJTiB0ZXN0ZXIyCiRUVEwgMzYwMApfaHR0cHMuX3RjcCBVUkkgMTAgMSBodHRwczovL2h1Yi5jcnV4cGF5LmNvbQ==\"\ntester101\tIN\tTXT\t\"owner=1EdQUGMKPpa4NGpJYy7s1Gb8aHhdJpQQQSS\" \"seqn=0\" \"parts=1\" \"zf0=JE9SSUdJTiB0ZXN0ZXIyCiRUVEwgMzYwMApfaHR0cHMuX3RjcCBVUkkgMTAgMSBodHRwczovL2h1Yi5jcnV4cGF5LmNvbQ==\"\ntester102\tIN\tTXT\t\"owner=1EdQUGMKPpa4NGpJYy7s1Gb8aHhdJpQSQSS\" \"seqn=0\" \"parts=1\" \"zf0=JE9SSUdJTiB0ZXN0ZXIyCiRUVEwgMzYwMApfaHR0cHMuX3RjcCBVUkkgMTAgMSBodHRwczovL2h1Yi5jcnV4cGF5LmNvbQ==\"\n_http._tcp\tIN\tURI\t10\t1\t\"https://gaia.blockstack.org/hub/1J2CJ2Q2rMaYftnwQiSQ6rwTuq3xPBFuw3/profile.json\"\n",
            "zonefile_hash": "3df4830e1a3f92ce33deecc0a16f70fe2727723e"
        }
        const testcaseBlockstackIdString = "testcase_crux.id";
        const testcaseDomainString = "testcase";
        const testcaseNameDetail = {
            "status": "available"
        }

        beforeEach(() => {
            // mocking the public methods
            mockBlockstackNamingServiceApiClient = {
                fetchIDsByAddress: sandbox.stub().throws("unhandled in fetchIDsByAddress mocks"),
                resolveName: sandbox.stub().throws("unhandled in resolveName mocks"),
            };
            mockBlockstackSubdomainRegistrarApiClient = {
                getSubdomainStatus: sandbox.stub().throws("unhandled in getSubdomainStatus mocks"),
                registerSubdomain: sandbox.stub().throws("unhandled in registerSubdomain mocks"),
                fetchPendingRegistrationsByAddress: sandbox.stub().throws("unhandled in fetchPendingRegistrationsByAddress mocks"),
                getIndex: sandbox.stub().throws("unhandled in getIndex mocks"),
            };
            // mocks
            mockBlockstackNamingServiceApiClient.resolveName.withArgs(cruxdevBlockstackIdString).resolves(cruxdevNameDetail);
            mockBlockstackNamingServiceApiClient.resolveName.withArgs(testcaseBlockstackIdString).resolves(testcaseNameDetail);
            sandbox.stub(apiClients, 'BlockstackNamingServiceApiClient').returns(mockBlockstackNamingServiceApiClient);
            sandbox.stub(apiClients, 'BlockstackSubdomainRegistrarApiClient').returns(mockBlockstackSubdomainRegistrarApiClient);
            blockstackService = new BlockstackService({
                infrastructure: CruxSpec.blockstack.infrastructure,
            });
        })
        describe('getNameDetails tests', () => {
            it('"cruxdev" should return the complete name details', async () => {
                const nameDetails = await blockstackService.getNameDetails(cruxdevBlockstackIdString);
                expect(nameDetails).haveOwnProperty("address").to.be.string;
                expect(nameDetails).haveOwnProperty("blockchain").to.be.string;
                expect(nameDetails).haveOwnProperty("did").to.be.string;
                expect(nameDetails).haveOwnProperty("last_txid").to.be.string;
                expect(nameDetails).haveOwnProperty("status").to.be.equal("registered");
                expect(nameDetails).haveOwnProperty("zonefile").to.be.string;
                expect(nameDetails).haveOwnProperty("zonefile_hash").to.be.string;
                expect(mockBlockstackNamingServiceApiClient.resolveName.calledTwice).to.be.true;
                expect(mockBlockstackNamingServiceApiClient.resolveName.calledWith(cruxdevBlockstackIdString)).to.be.true;
            })
            it('"testcase should return the status availability"', async () => {
                const nameDetails = await blockstackService.getNameDetails(testcaseBlockstackIdString);
                expect(nameDetails).haveOwnProperty("status").to.be.equal("available");
                expect(mockBlockstackNamingServiceApiClient.resolveName.calledTwice).to.be.true;
                expect(mockBlockstackNamingServiceApiClient.resolveName.calledWith(testcaseBlockstackIdString)).to.be.true;
            })
            it('"pendingId" should return with "more" field')
        })
        describe('getDomainRegistrationStatus tests', () => {
            it('"cruxdev" should be REGISTERED', async () => {
                const domainAvailability = await blockstackService.getDomainRegistrationStatus(cruxdevDomainString);
                expect(domainAvailability).to.be.equal(DomainRegistrationStatus.REGISTERED);
                expect(mockBlockstackNamingServiceApiClient.resolveName.calledTwice).to.be.true;
                expect(mockBlockstackNamingServiceApiClient.resolveName.calledWith(cruxdevBlockstackIdString)).to.be.true;
            }) 
            it('"testcase" should be AVAILABLE', async () => {
                const domainAvailability = await blockstackService.getDomainRegistrationStatus(testcaseDomainString);
                expect(domainAvailability).to.be.equal(DomainRegistrationStatus.AVAILABLE);
                expect(mockBlockstackNamingServiceApiClient.resolveName.calledTwice).to.be.true;
                expect(mockBlockstackNamingServiceApiClient.resolveName.calledWith(testcaseBlockstackIdString)).to.be.true;
            })
            it('"pendingId" should be PENDING')
        })
        describe('getClientConfig', () => {
            it('"cruxdev" should ')
        })
        describe('putClientConfig', () => {})
        describe('restoreDomain', () => {})
        describe('getAddressMap', () => {})
        describe('putAddressMap', () => {})
        describe('getBlockstackIdFromKeyManager', () => {})
        describe('isCruxIdAvailable', () => {})
        describe('registerCruxId', () => {})
        describe('getCruxIdRegistrationStatus', () => {})
    })
    describe('Testing BlockstackSubdomainRegistrarApiClient', () => {
    })
    describe('Testing BlockstackNamingServiceApiClient', () => {
    })
});