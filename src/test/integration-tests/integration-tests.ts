import 'mocha';
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import * as chai from "chai";
import { CruxWalletClient, ICruxWalletClientOptions } from '../../application/clients/crux-wallet-client';
import { CruxId } from '../../packages/identity-utils';
import { IAddress, SubdomainRegistrationStatus, SubdomainRegistrationStatusDetail } from '../../core';
import * as utils from "../../packages/utils";
import { PackageErrorCode, CruxClientError } from '../../packages/error';
import WebCrypto from "node-webcrypto-ossl";
chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;

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

describe("CruxWalletClient integration tests", () => {
    let sandbox: sinon.SinonSandbox;
    let cruxWalletClient: CruxWalletClient;
    // fixtures
    const testCruxId: CruxId = CruxId.fromString("test_crux_id@cruxdev.crux");
    const btcAddress: IAddress = {addressHash: "1HX4KvtPdg9QUYwQE1kNqTAjmNaDG7w82V"};
    const ethAddress: IAddress = {addressHash: "0x0a2311594059b468c9897338b027c8782398b481"};
    before(() => { sandbox = sinon.createSandbox(); })
    afterEach(() => { sandbox.restore(); })
    describe("CruxWalletClient without privateKey", () => {
        beforeEach(() => {
            // initialisation
            const cruxWalletClientOptions: ICruxWalletClientOptions = {
                walletClientName: "cruxdev",
            }
            cruxWalletClient = new CruxWalletClient(cruxWalletClientOptions);
        })
        it("check cruxId availability", async () => {
            const cruxIdAvailability = await cruxWalletClient.isCruxIDAvailable(testCruxId.components.subdomain);
            expect(cruxIdAvailability).to.be.false;
        })
        it("resolve currency address for testCruxId", async () => {
            const resolvedAddress = await cruxWalletClient.resolveCurrencyAddressForCruxID(testCruxId.toString(), "btc");
            expect(resolvedAddress).to.be.eql(btcAddress);
        })
        it("resolving address of a user whose gaia record is tampered (non-conforming decodedToken)", async () => {
            // mocking
            const requestOptions = {
                baseUrl: "https://gaia.cruxpay.com/",
                json: true,
                method: "GET",
                url: "1ATf5YwcEARWMCZdS8x3BXmkodkvnMW4Tf/cruxdev_client-config.json",
            }
            const mockGaiaRecord = [{"token":"eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJjbGFpbSI6eyJkNzhjMjZmOC03YzEzLTQ5MDktYmY2Mi01N2Q3NjIzZjhlZTgiOnsiYWRkcmVzc0hhc2giOiIxSFg0S3Z0UGRnOVFVWXdRRTFrTnFUQWptTmFERzd3ODJWIn19LCJpc3N1ZXIiOnsicHVibGljS2V5IjoiMDJlOGUxZGVhYmI3MGFlMGY4YzQzNjVkZDc0ZTE3ZjIwMmEwNzU3NjBmZjVhMDI4MDgzOGVmNGI2ZjUyMWM0NjE0In0sInN1YmplY3QiOnsicHVibGljS2V5IjoiMDJlOGUxZGVhYmI3MGFlMGY4YzQzNjVkZDc0ZTE3ZjIwMmEwNzU3NjBmZjVhMDI4MDgzOGVmNGI2ZjUyMWM0NjE0In19.fVony1HEW0oz5hewmBEfB0dIX5OqsYnrN5qqcnVLwOm3dHqTsCjyjbMcmvYQzlUuBdt2S8Lh8mK0Gdxm_5VFyw","decodedToken":{"header":{"typ":"JWT","alg":"ES256K"},"payload":{"claim":{"d78c26f8-7c13-4909-bf62-57d7623f8ee8":{"addressHash":"MALICIOUS_BTC_ADDRESS"}},"issuer":{"publicKey":"02e8e1deabb70ae0f8c4365dd74e17f202a075760ff5a0280838ef4b6f521c4614"},"subject":{"publicKey":"02e8e1deabb70ae0f8c4365dd74e17f202a075760ff5a0280838ef4b6f521c4614"}},"signature":"fVony1HEW0oz5hewmBEfB0dIX5OqsYnrN5qqcnVLwOm3dHqTsCjyjbMcmvYQzlUuBdt2S8Lh8mK0Gdxm_5VFyw"}}]
            const mockHttpJSONRequest = sandbox.stub(utils, "httpJSONRequest").callThrough().withArgs(sinon.match(requestOptions)).resolves(mockGaiaRecord);
            // calling the method
            let raisedError;
            try {
                const resolvedAddress = await cruxWalletClient.resolveCurrencyAddressForCruxID(testCruxId.toString(), "btc");
            } catch (error) {
                raisedError = error;
            }
            // expectations
            expect(mockHttpJSONRequest.calledOnce).to.be.true;
            expect(raisedError).to.be.instanceOf(CruxClientError);
            expect(raisedError["errorCode"]).to.be.equal(PackageErrorCode.GaiaRecordIntegrityFailed);
        })
        it("resolving address of a user whose gaiaHub is tampered (malicious gaiaHub info response)", async () => {
            const requestOptions = {
                baseUrl: "https://hub.cruxpay.com",
                url: "/hub_info",
            };
            const mockGaiaHubInfoResponse = {"challenge_text":"[\"gaiahub\",\"0\",\"hub.cruxpay.com\",\"blockstack_storage_please_sign\"]","latest_auth_version":"v1","max_file_upload_size_megabytes":20,"read_url_prefix":"https://gaia.cruxpay.com?fakeKey=${console.log('test')}"};
            const mockHttpJSONRequest = sandbox.stub(utils, "httpJSONRequest").callThrough().withArgs(sinon.match(requestOptions)).resolves(mockGaiaHubInfoResponse);
            const resolvedAddress = await cruxWalletClient.resolveCurrencyAddressForCruxID(testCruxId.toString(), "btc");
            // @ts-ignore
            expect(mockHttpJSONRequest.parent.neverCalledWith(sinon.match({ baseUrl: "https://gaia.cruxpay.com?fakeKey=${console.log('test')}" }))).to.be.true;
        })
        it("resolving address of a user whose gaiaHub is tampered (malicious gaiaHub info response 2)", async () => {
            const requestOptions = {
                baseUrl: "https://hub.cruxpay.com",
                url: "/hub_info",
            };
            const mockGaiaHubInfoResponse = {"challenge_text":"[\"gaiahub\",\"0\",\"hub.cruxpay.com\",\"blockstack_storage_please_sign\"]","latest_auth_version":"v1","max_file_upload_size_megabytes":20,"read_url_prefix":"https://gaia.cruxpay.com/f@akeHubPath!"};
            const mockHttpJSONRequest = sandbox.stub(utils, "httpJSONRequest").callThrough().withArgs(sinon.match(requestOptions)).resolves(mockGaiaHubInfoResponse);
            let raisedError;
            try {
                const resolvedAddress = await cruxWalletClient.resolveCurrencyAddressForCruxID(testCruxId.toString(), "btc");
            } catch (error) {
                raisedError = error;
            }
            expect(raisedError).to.be.instanceOf(CruxClientError);
            expect(raisedError.message).to.include.string("invalid characters");
            // @ts-ignore
            expect(mockHttpJSONRequest.parent.neverCalledWith(sinon.match({ baseUrl: "https://gaia.cruxpay.com/f@akeHubPath!" }))).to.be.true;
        })
    })
    describe("CruxWalletClient with testPrivateKey (registered)", () => {
        beforeEach(() => {
            // initialisation
            const cruxWalletClientOptions: ICruxWalletClientOptions = {
                walletClientName: "cruxdev",
                privateKey: "L3ugweKa2xz4hbe7528qmm3Dvr9xEhHw7zdhk9zRgtRhmn1nrcHB",
            }
            cruxWalletClient = new CruxWalletClient(cruxWalletClientOptions);
        })
        it("get testCruxId registration status", async () => {
            const cruxIdState = await cruxWalletClient.getCruxIDState();
            expect(cruxIdState).to.be.eql({
                cruxID: testCruxId.toString(),
                status: {
                    status: SubdomainRegistrationStatus.DONE,
                    statusDetail: SubdomainRegistrationStatusDetail.DONE,
                }
            });
        })
        it("getAddressMap for the testCruxId", async () => {
            const addressMap = await cruxWalletClient.getAddressMap();
            expect(addressMap).to.be.eql({"btc": btcAddress});
        })
        it("putAddressMap for the testCruxId", async () => {
            const {success, failures} = await cruxWalletClient.putAddressMap({"btc": btcAddress});
            expect(success).to.be.eql({"btc": btcAddress});
            expect(failures).to.be.eql({});
        })
        it("getAddressMap for the testCruxId when the gaia record is tampered", async () => {
            const requestOptions = {
                baseUrl: "https://gaia.cruxpay.com/",
                json: true,
                method: "GET",
                url: "1ATf5YwcEARWMCZdS8x3BXmkodkvnMW4Tf/cruxdev_client-config.json",
            };
            const mockGaiaRecord = [{"token":"eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJjbGFpbSI6eyJkNzhjMjZmOC03YzEzLTQ5MDktYmY2Mi01N2Q3NjIzZjhlZTgiOnsiYWRkcmVzc0hhc2giOiIxSFg0S3Z0UGRnOVFVWXdRRTFrTnFUQWptTmFERzd3ODJWIn19LCJpc3N1ZXIiOnsicHVibGljS2V5IjoiMDJlOGUxZGVhYmI3MGFlMGY4YzQzNjVkZDc0ZTE3ZjIwMmEwNzU3NjBmZjVhMDI4MDgzOGVmNGI2ZjUyMWM0NjE0In0sInN1YmplY3QiOnsicHVibGljS2V5IjoiMDJlOGUxZGVhYmI3MGFlMGY4YzQzNjVkZDc0ZTE3ZjIwMmEwNzU3NjBmZjVhMDI4MDgzOGVmNGI2ZjUyMWM0NjE0In19.fVony1HEW0oz5hewmBEfB0dIX5OqsYnrN5qqcnVLwOm3dHqTsCjyjbMcmvYQzlUuBdt2S8Lh8mK0Gdxm_5VFyw","decodedToken":{"header":{"typ":"JWT","alg":"ES256K"},"payload":{"claim":{"d78c26f8-7c13-4909-bf62-57d7623f8ee8":{"addressHash":"MALICIOUS_BTC_ADDRESS"}},"issuer":{"publicKey":"02e8e1deabb70ae0f8c4365dd74e17f202a075760ff5a0280838ef4b6f521c4614"},"subject":{"publicKey":"02e8e1deabb70ae0f8c4365dd74e17f202a075760ff5a0280838ef4b6f521c4614"}},"signature":"fVony1HEW0oz5hewmBEfB0dIX5OqsYnrN5qqcnVLwOm3dHqTsCjyjbMcmvYQzlUuBdt2S8Lh8mK0Gdxm_5VFyw"}}];
            const mockHttpJSONRequest = sinon.stub(utils, "httpJSONRequest").callThrough().withArgs(sinon.match(requestOptions)).resolves(mockGaiaRecord);
            let raisedError;
            try {
                const addressMap = await cruxWalletClient.getAddressMap();
            } catch (error) {
                raisedError = error;
            }
            expect(mockHttpJSONRequest.calledOnce).to.be.true;
            expect(raisedError).to.be.instanceOf(CruxClientError);
            expect(raisedError["errorCode"]).to.be.equal(PackageErrorCode.GaiaRecordIntegrityFailed);
        })
    })
    describe("CruxWalletClient with newPrivateKey (unregistered)", () => {
        // TODO: require mocking the registration flow
        // fixtures
        const newPrivateKey = "L55gyEaVgR2DtP3ssSxYx7MV3VJkScCrRduJe7FPuJChCfpb629n";
        const newCruxId: CruxId = CruxId.fromString("new_crux_id@cruxdev.crux");
        beforeEach(() => {
            // initialisation
            const cruxWalletClientOptions: ICruxWalletClientOptions = {
                walletClientName: "cruxdev",
                privateKey: newPrivateKey,
            }
            cruxWalletClient = new CruxWalletClient(cruxWalletClientOptions);
        })
        it("check cruxId availability")
        it("register a newCruxId")
        it("get newCruxId registration status")
        it("getAddressMap for the testCruxId")
        it("putAddressMap for the testCruxId")
    })
})
