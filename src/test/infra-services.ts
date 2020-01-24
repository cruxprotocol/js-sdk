import { expect } from 'chai';
import sinon from "sinon";
import 'mocha';
import { BasicKeyManager } from '../infrastructure/implementations/basic-key-manager';
import { CruxSpec } from '../core/entities/crux-spec';
import { GaiaService } from '../infrastructure/services/gaia-service';
import WebCrypto from "node-webcrypto-ossl";
import * as apiClients from '../infrastructure/services/api-clients';
import { BlockstackService } from '../infrastructure/services/blockstack-service';
import { DomainRegistrationStatus } from '../core/entities/crux-domain';
import { CruxDomainId, CruxId } from '../packages/identity-utils';
import { publicKeyToAddress } from 'blockstack';
import { SubdomainRegistrationStatusDetail, SubdomainRegistrationStatus } from '../core/entities/crux-user';
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
                getHubInfo: sandbox.stub(apiClients.GaiaServiceApiClient, 'getHubInfo').throws("getHubInfo unhandled in mocks"),
                retrieve: sandbox.stub(apiClients.GaiaServiceApiClient, 'retrieve').throws("retrieve unhandled in mocks"),
                store: sandbox.stub(apiClients.GaiaServiceApiClient, 'store').throws("store unhandled in mocks"),
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
        it('testing getGaiaReadUrl', async () => {
            // input
            const gaiaHub = "https://hub.cruxpay.com";

            // calling the method
            const readUrlPrefix = await GaiaService.getGaiaReadUrl(gaiaHub);

            // run expectations
            expect(readUrlPrefix).to.be.eql("https://gaia.cruxpay.com/");
        })
        it('getContentFromGaiaHub test', async () => {
            // inputs
            const readUrlPrefix = "https://gaia.cruxpay.com/";
            const ownerAddress = "1HkXFmLCg4zmPZyf2W5hbpV79EHwG52cEA";
            const fileName = "cruxdev_cruxpay.json"

            // mocks
            staticMocksGaiaServiceApiClient.retrieve.withArgs(readUrlPrefix, ownerAddress, fileName).resolves([
                {
                  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJjbGFpbSI6eyJkNzhjMjZmOC03YzEzLTQ5MDktYmY2Mi01N2Q3NjIzZjhlZTgiOnsiYWRkcmVzc0hhc2giOiIxSFg0S3Z0UGRnOVFVWXdRRTFrTnFUQWptTmFERzd3ODJWIiwic2VjSWRlbnRpZmllciI6IiJ9LCJhYmUwMDMwYS1kOGUzLTQ1MTgtODc5Zi1jZDk5MzliN2Q4YWIiOnsiYWRkcmVzc0hhc2giOiJycGZLQUEyRXpxb3E1d1dvM1hFTmRMWWRaOFlHeml6NDhoIiwic2VjSWRlbnRpZmllciI6IjU1NTUifSwiNGU0ZDk5ODItMzQ2OS00MjFiLWFiNjAtMmMwYzJmMDUzODZhIjp7ImFkZHJlc3NIYXNoIjoiMHgwYTIzMTE1OTQwNTliNDY4Yzk4OTczMzhiMDI3Yzg3ODIzOThiNDgxIiwic2VjSWRlbnRpZmllciI6IiJ9fSwiaXNzdWVyIjp7InB1YmxpY0tleSI6IjAzNjJmMTcxYTQwYWI1ZTZhZDIyMjc1ZWMxNjZmMTVhMjMyYjgzYTU3MWJhYjljMzA2MjJlZDI5NjNmMWRhNGMwOCJ9LCJzdWJqZWN0Ijp7InB1YmxpY0tleSI6IjAzNjJmMTcxYTQwYWI1ZTZhZDIyMjc1ZWMxNjZmMTVhMjMyYjgzYTU3MWJhYjljMzA2MjJlZDI5NjNmMWRhNGMwOCJ9fQ.GjbwIlaA4WrvEK0Kg5L3DPZwtxOJCodZKpOU-d7HZfpNTiDONYurc1v5PZVyVWadA-4iLce1NfIb5-pYsTLYhQ",
                  "decodedToken": {
                    "header": {
                      "typ": "JWT",
                      "alg": "ES256K"
                    },
                    "payload": {
                      "claim": {
                        "d78c26f8-7c13-4909-bf62-57d7623f8ee8": {
                          "addressHash": "1HX4KvtPdg9QUYwQE1kNqTAjmNaDG7w82V",
                          "secIdentifier": ""
                        },
                        "abe0030a-d8e3-4518-879f-cd9939b7d8ab": {
                          "addressHash": "rpfKAA2Ezqoq5wWo3XENdLYdZ8YGziz48h",
                          "secIdentifier": "5555"
                        },
                        "4e4d9982-3469-421b-ab60-2c0c2f05386a": {
                          "addressHash": "0x0a2311594059b468c9897338b027c8782398b481",
                          "secIdentifier": ""
                        }
                      },
                      "issuer": {
                        "publicKey": "0362f171a40ab5e6ad22275ec166f15a232b83a571bab9c30622ed2963f1da4c08"
                      },
                      "subject": {
                        "publicKey": "0362f171a40ab5e6ad22275ec166f15a232b83a571bab9c30622ed2963f1da4c08"
                      }
                    },
                    "signature": "GjbwIlaA4WrvEK0Kg5L3DPZwtxOJCodZKpOU-d7HZfpNTiDONYurc1v5PZVyVWadA-4iLce1NfIb5-pYsTLYhQ"
                  }
                }
              ])

            // calling the method
            const content = await GaiaService.getContentFromGaiaHub(readUrlPrefix, ownerAddress, fileName);

            // run expectations
            expect(content).to.be.eql({
                "claim": {
                    "d78c26f8-7c13-4909-bf62-57d7623f8ee8": {
                    "addressHash": "1HX4KvtPdg9QUYwQE1kNqTAjmNaDG7w82V",
                    "secIdentifier": ""
                    },
                    "abe0030a-d8e3-4518-879f-cd9939b7d8ab": {
                    "addressHash": "rpfKAA2Ezqoq5wWo3XENdLYdZ8YGziz48h",
                    "secIdentifier": "5555"
                    },
                    "4e4d9982-3469-421b-ab60-2c0c2f05386a": {
                    "addressHash": "0x0a2311594059b468c9897338b027c8782398b481",
                    "secIdentifier": ""
                    }
                }
            });
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
        let staticMocksBlockstackNamingServiceApiClient;
        let mockBlockstackSubdomainRegistrarApiClient;
        let blockstackService: BlockstackService;
        // fixtures
        const cruxGaiaHub = "https://hub.cruxpay.com";
        const cruxdevBlockstackName = "cruxdev_crux.id";
        const cruxdevDomainString = "cruxdev";
        const cruxdevDomainId = new CruxDomainId(cruxdevDomainString);
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
        const cruxdevConfigCruxName = "_config@cruxdev.crux";
        const cruxdevConfigBlockstackName = "_config.cruxdev_crux.id";
        const cruxdevConfigCruxId = CruxId.fromString(cruxdevConfigCruxName);
        const cruxdevConfigSubdomainPrivateKey = "d4a7eab17471d190a0d6cfa00546dceeac88f333b8a2d16fb4464e1e57ac188f";    // random-private-key;
        const cruxdevConfigKeyManager = new BasicKeyManager(cruxdevConfigSubdomainPrivateKey)
        const cruxdevConfigNameDetails = {
            "address": "16wXkSf8kwFGz3oGbHW2aofHuBLX6MWgeh",
            "blockchain": "bitcoin",
            "did": "did:stack:v0:SWkf7PikxXchsWM5yZw7jRvKTQzMcdb5Pc-0",
            "last_txid": "bfa29d44fd31e4307c9fc0229964aaec1a6efc014e4c94681e2372f5f7d474ec",
            "status": "registered_subdomain",
            "zonefile": "$ORIGIN _config\n$TTL 3600\n_https._tcp URI 10 1 https://hub.cruxpay.com",
            "zonefile_hash": "776172a0bc8400a4046d0325dd87e78b48a2f66b"
        }
        const testUserCruxIdString = "mascot6699@cruxdev.crux";
        const testUserBlockstackName = "mascot6699.cruxdev_crux.id";
        const testUserCruxId = CruxId.fromString(testUserCruxIdString);
        const testUserPrivKey = "cdf2d276caf0c9c34258ed6ebd0e60e0e8b3d9a7b8a9a717f2e19ed9b37f7c6f";
        const testUserKeyManager = new BasicKeyManager(testUserPrivKey);
        const testUserNameDetails = {
            "address": "1HkXFmLCg4zmPZyf2W5hbpV79EHwG52cEA",
            "blockchain": "bitcoin",
            "did": "did:stack:v0:Se3XHc7MQSBxusm7Zw4n9idfo1XN3p6b3B-0",
            "last_txid": "32521d18c1727c31dfe879f5d0d0833f4061bd642f6bd2fedf802e547a58c7c4",
            "status": "registered_subdomain",
            "zonefile": "$ORIGIN mascot6699\n$TTL 3600\n_https._tcp URI 10 1 https://hub.cruxpay.com",
            "zonefile_hash": "69c818f265a38101e495de03bc88afcd1ea428b2"
        }
        const newCruxUserBlockstackName = "newuser.cruxdev_crux.id";
        const newCruxUserId = CruxId.fromString("newuser@cruxdev.crux");
        const newCruxUserKeyManager = new BasicKeyManager("8a9894340ca9bc9313fd2ed42a9819f41af52c49771330f96418be1316f54842");  // random private-key;
        const testcaseBlockstackName = "testcase_crux.id";
        const testcaseDomainString = "testcase";
        const testcaseCruxDomainId = new CruxDomainId(testcaseDomainString);
        const testcaseNameDetail = {
            "status": "available"
        }

        beforeEach(() => {
            // mocking static methods
            staticMocksBlockstackNamingServiceApiClient = {
                getNamesByAddress: sandbox.stub(apiClients.BlockstackNamingServiceApiClient, 'getNamesByAddress').throws("unhandled in getNamesByAddress mocks"),
                getNameDetails: sandbox.stub(apiClients.BlockstackNamingServiceApiClient, 'getNameDetails').throws("unhandled in getNameDetails mocks"),
            }
            // mocking the public methods
            mockBlockstackNamingServiceApiClient = {};
            mockBlockstackSubdomainRegistrarApiClient = {
                getSubdomainStatus: sandbox.stub().throws("unhandled in getSubdomainStatus mocks"),
                registerSubdomain: sandbox.stub().throws("unhandled in registerSubdomain mocks"),
                getSubdomainRegistrarEntriesByAddress: sandbox.stub().throws("unhandled in getSubdomainRegistrarEntriesByAddress mocks"),
                getIndex: sandbox.stub().throws("unhandled in getIndex mocks"),
            };
            // // mocks
            // mockBlockstackNamingServiceApiClient.resolveName.withArgs(cruxdevBlockstackIdString).resolves(cruxdevNameDetail);
            // mockBlockstackNamingServiceApiClient.resolveName.withArgs(testcaseBlockstackIdString).resolves(testcaseNameDetail);
            sandbox.stub(apiClients, 'BlockstackNamingServiceApiClient').returns(mockBlockstackNamingServiceApiClient);
            sandbox.stub(apiClients, 'BlockstackSubdomainRegistrarApiClient').returns(mockBlockstackSubdomainRegistrarApiClient);
            blockstackService = new BlockstackService({
                bnsNodes: CruxSpec.blockstack.infrastructure.bnsNodes,
                subdomainRegistrar: CruxSpec.blockstack.infrastructure.subdomainRegistrar,
            });
        })
        describe('getNameDetails tests', () => {
            it('"cruxdev" should return the complete name details', async () => {
                staticMocksBlockstackNamingServiceApiClient.getNameDetails.resolves(cruxdevNameDetail);
                const nameDetails = await blockstackService.getNameDetails(cruxdevDomainId);
                expect(nameDetails).haveOwnProperty("address").to.be.string;
                expect(nameDetails).haveOwnProperty("blockchain").to.be.string;
                expect(nameDetails).haveOwnProperty("did").to.be.string;
                expect(nameDetails).haveOwnProperty("last_txid").to.be.string;
                expect(nameDetails).haveOwnProperty("status").to.be.equal("registered");
                expect(nameDetails).haveOwnProperty("zonefile").to.be.string;
                expect(nameDetails).haveOwnProperty("zonefile_hash").to.be.string;
                expect(staticMocksBlockstackNamingServiceApiClient.getNameDetails.calledTwice).to.be.true;
                expect(staticMocksBlockstackNamingServiceApiClient.getNameDetails.calledWith(sinon.match.string, cruxdevBlockstackName)).to.be.true;
            })
            it('"testcase should return the status availability"', async () => {
                staticMocksBlockstackNamingServiceApiClient.getNameDetails.resolves(testcaseNameDetail);
                const nameDetails = await blockstackService.getNameDetails(testcaseCruxDomainId);
                expect(nameDetails).haveOwnProperty("status").to.be.equal("available");
                expect(staticMocksBlockstackNamingServiceApiClient.getNameDetails.calledTwice).to.be.true;
                expect(staticMocksBlockstackNamingServiceApiClient.getNameDetails.calledWith(sinon.match.string, testcaseBlockstackName)).to.be.true;
            })
            it('"pendingId" should return with "more" field')
        })
        describe('getGaiaHub tests', () => {
            it('"cruxdev" should return cruxpay gaia hub', async () => {
                staticMocksBlockstackNamingServiceApiClient.getNameDetails.resolves(cruxdevConfigNameDetails);
                const gaiaHub = await blockstackService.getGaiaHub(cruxdevConfigCruxId);
                expect(gaiaHub).to.be.equal(cruxGaiaHub);
                expect(staticMocksBlockstackNamingServiceApiClient.getNameDetails.calledTwice).to.be.true;
                expect(staticMocksBlockstackNamingServiceApiClient.getNameDetails.calledWith(sinon.match.string, cruxdevConfigBlockstackName)).to.be.true;
            })
        })
        describe('getDomainRegistrationStatus tests', () => {
            it('"cruxdev" should be REGISTERED', async () => {
                staticMocksBlockstackNamingServiceApiClient.getNameDetails.resolves(cruxdevNameDetail);
                const domainAvailability = await blockstackService.getDomainRegistrationStatus(cruxdevDomainId);
                expect(domainAvailability).to.be.equal(DomainRegistrationStatus.REGISTERED);
                expect(staticMocksBlockstackNamingServiceApiClient.getNameDetails.calledTwice).to.be.true;
                expect(staticMocksBlockstackNamingServiceApiClient.getNameDetails.calledWith(sinon.match.string, cruxdevBlockstackName)).to.be.true;
            }) 
            it('"testcase" should be AVAILABLE', async () => {
                staticMocksBlockstackNamingServiceApiClient.getNameDetails.resolves(testcaseNameDetail);
                const domainAvailability = await blockstackService.getDomainRegistrationStatus(testcaseCruxDomainId);
                expect(domainAvailability).to.be.equal(DomainRegistrationStatus.AVAILABLE);
                expect(staticMocksBlockstackNamingServiceApiClient.getNameDetails.calledTwice).to.be.true;
                expect(staticMocksBlockstackNamingServiceApiClient.getNameDetails.calledWith(sinon.match.string, testcaseBlockstackName)).to.be.true;
            })
            it('"pendingId" should be PENDING')
        })
        describe('getCruxDomainIdWithConfigKeyManager tests', () => {
            it('"cruxdev" should be available on the corresponding config key', async () => {
                staticMocksBlockstackNamingServiceApiClient.getNamesByAddress.resolves({
                    "names": [
                        "_config.cruxdev_crux.id"
                    ]
                });
                const cruxDomainId = await blockstackService.getCruxDomainIdWithConfigKeyManager(cruxdevConfigKeyManager);
                expect(cruxDomainId).to.be.instanceOf(CruxDomainId);
                expect(cruxDomainId.toString()).to.be.equal(cruxdevDomainId.toString());
                expect(staticMocksBlockstackNamingServiceApiClient.getNamesByAddress.calledTwice).to.be.true;
                expect(staticMocksBlockstackNamingServiceApiClient.getNamesByAddress.calledWith(sinon.match.any, cruxdevConfigNameDetails.address)).to.be.true;
            })
        })
        describe('getCruxIdWithKeyManager tests', () => {
            it('"mascot6699" should be available on the corresponding key', async () => {
                staticMocksBlockstackNamingServiceApiClient.getNamesByAddress.resolves({
                    "names": [
                        "damn.zel_crux.id",
                        "mascot6699.cruxdev_crux.id"
                    ]
                });
                const cruxId = await blockstackService.getCruxIdWithKeyManager(testUserKeyManager, cruxdevDomainId);
                expect(cruxId).to.be.instanceOf(CruxId);
                expect(cruxId.toString()).to.be.equal(testUserCruxId.toString());
                expect(staticMocksBlockstackNamingServiceApiClient.getNamesByAddress.calledTwice).to.be.true;
                expect(staticMocksBlockstackNamingServiceApiClient.getNamesByAddress.calledWith(sinon.match.any, testUserNameDetails.address)).to.be.true;
            })
        })
        describe('isCruxIdAvailable tests', () => {
            it('"mascot6699" should not be available', async () => {
                const subdomainString = "mascot6699";
                mockBlockstackSubdomainRegistrarApiClient.getSubdomainStatus.withArgs(subdomainString).resolves({
                    "status": "Subdomain propagated"
                });
                const availability = await blockstackService.isCruxIdAvailable(testUserCruxId);
                expect(availability).to.be.false;
                expect(mockBlockstackSubdomainRegistrarApiClient.getSubdomainStatus.calledOnceWith(subdomainString)).to.be.true;
            })
            it('"testcase" should be available', async () => {
                const subdomainString = "testcase";
                mockBlockstackSubdomainRegistrarApiClient.getSubdomainStatus.withArgs().resolves({
                    "status": "Subdomain not registered with this registrar",
                    "statusCode": 404
                });
                const availability = await blockstackService.isCruxIdAvailable(new CruxId({subdomain: subdomainString, domain: "cruxdev"}));
                expect(availability).to.be.true;
                expect(mockBlockstackSubdomainRegistrarApiClient.getSubdomainStatus.calledOnceWith(subdomainString)).to.be.true;
            })
        })
        describe('registerCruxId tests', () => {
            it('normal registration should return a valid crux user information', async () => {
                mockBlockstackSubdomainRegistrarApiClient.getSubdomainStatus.withArgs("newuser")
                .onFirstCall().resolves({
                    "status": "Subdomain not registered with this registrar",
                    "statusCode": 404
                })
                .onSecondCall().resolves({
                    status: "Subdomain is queued for update and should be announced within the next few blocks."
                });
                mockBlockstackSubdomainRegistrarApiClient.registerSubdomain.withArgs("newuser", cruxGaiaHub, publicKeyToAddress(await newCruxUserKeyManager.getPubKey())).resolves();
                staticMocksBlockstackNamingServiceApiClient.getNameDetails.withArgs(sinon.match.string, newCruxUserBlockstackName).resolves({
                    status: 'available',
                    more: 'failed to find parent domain\'s resolver'
                });
                const cruxUserInformation = await blockstackService.registerCruxId(newCruxUserId, cruxGaiaHub, newCruxUserKeyManager);
                expect(cruxUserInformation).to.be.eql({
                    registrationStatus: {
                        status: SubdomainRegistrationStatus.PENDING,
                        statusDetail: SubdomainRegistrationStatusDetail.PENDING_BLOCKCHAIN,
                    }
                });
                expect(mockBlockstackSubdomainRegistrarApiClient.getSubdomainStatus.calledTwice).to.be.true;
                expect(mockBlockstackSubdomainRegistrarApiClient.getSubdomainStatus.calledWith("newuser")).to.be.true;
                expect(mockBlockstackSubdomainRegistrarApiClient.registerSubdomain.calledOnceWith("newuser", cruxGaiaHub, publicKeyToAddress(await newCruxUserKeyManager.getPubKey()))).to.be.true;
                expect(staticMocksBlockstackNamingServiceApiClient.getNameDetails.calledTwice).to.be.true;
                expect(staticMocksBlockstackNamingServiceApiClient.getNameDetails.calledWith(sinon.match.string, newCruxUserBlockstackName)).to.be.true;
            })
        })
        describe('getCruxIdRegistrationStatus tests', () => {
            it('"mascot6699" should be REGISTERED', async () => {
                staticMocksBlockstackNamingServiceApiClient.getNameDetails.withArgs(sinon.match.string, testUserBlockstackName).resolves(testUserNameDetails);
                const cruxUserInformation = await blockstackService.getCruxIdInformation(testUserCruxId);
                expect(cruxUserInformation).to.be.eql({
                    ownerAddress: testUserNameDetails.address,
                    registrationStatus: {
                        status: SubdomainRegistrationStatus.DONE,
                        statusDetail: SubdomainRegistrationStatusDetail.DONE,
                    },
                    transactionHash: testUserNameDetails.last_txid,
                });
                expect(staticMocksBlockstackNamingServiceApiClient.getNameDetails.calledTwice).to.be.true;
                expect(staticMocksBlockstackNamingServiceApiClient.getNameDetails.calledWith(sinon.match.string, testUserBlockstackName)).to.be.true;
            })
            it('"newuser" should be AVAILABLE', async () => {
                staticMocksBlockstackNamingServiceApiClient.getNameDetails.withArgs(sinon.match.string, newCruxUserBlockstackName).resolves({
                    status: 'available',
                    more: 'failed to find parent domain\'s resolver'
                });
                mockBlockstackSubdomainRegistrarApiClient.getSubdomainStatus.withArgs("newuser").resolves({
                    "status": "Subdomain not registered with this registrar",
                    "statusCode": 404
                });
                const cruxUserInformation = await blockstackService.getCruxIdInformation(newCruxUserId);
                expect(cruxUserInformation).to.be.eql({
                    registrationStatus: {
                        status: SubdomainRegistrationStatus.NONE,
                        statusDetail: SubdomainRegistrationStatusDetail.NONE,
                    }
                });
                expect(staticMocksBlockstackNamingServiceApiClient.getNameDetails.calledTwice).to.be.true;
                expect(staticMocksBlockstackNamingServiceApiClient.getNameDetails.calledWith(sinon.match.string, newCruxUserBlockstackName)).to.be.true;
                expect(mockBlockstackSubdomainRegistrarApiClient.getSubdomainStatus.calledOnceWith("newuser")).to.be.true;
            })
        })
    })
});