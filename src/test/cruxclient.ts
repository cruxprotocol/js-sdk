import 'mocha';
import * as utils from "../packages/utils";
import requestFixtures from './requestMocks/cruxclient-reqmocks';
import sinon from "sinon";
import WebCrypto from "node-webcrypto-ossl";
import { expect } from 'chai';
import {CruxClient, PayIDClaim} from "../index";
import { ErrorHelper, PackageErrorCode } from '../packages/error';

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

describe('CruxClient tests', () => {

    let sampleAddressMap = {
        BTC: {
            addressHash: '1HX4KvtPdg9QUYwQE1kNqTAjmNaDG7w82V'
        },
        ETH: {
            addressHash: '0x0a2311594059b468c9897338b027c8782398b481'
        }
    };
    let mockedAddressMapping = {"1d6e1a99-1e77-41e1-9ebb-0e216faa166a": {addressHash: "19m51F8YkjzK625csaNtKnM9pgByeMJRU3"}}
    let sampleUser = {
        'payIDClaim': {"virtualAddress":"syedhassanashraf@cruxdev.crux","identitySecrets":"{\"iv\":\"d6mQLg2lv/SHvpPV\",\"encBuffer\":\"EJ0NDIGyvT+FMxjG9pD7yKkUVUJffcd0mU3V7rqgbpip5ikCR+kx/Xl4tJcBNtQUJzKbDPNJeeWdzUKH01NQOiyEe9qfCYEqzbJgj4PSqE/B1geSlCMRWcdJMdbrUDHgEcwDWw6PC41p0odNHLzMWOR1LA+PKVzCAMXRom6UppG+gjMnjp9QqF00SfnNR6wla/es7LgE3eF6O4Gq9Ku/mAhdYrZiaMMd47hQvTzH9KzDZrTjK37jmtiRC6cuNDy9zZ+BtpzufozAbuCvfeQc2nXKdV4a3kx7peLK7eAGZUV6soaOfq+ZIPx5bbnNos8Py7fhNOmqbop12yCQ4Ot2jm7Bmx9eXIFq7/EtLWP488xU3l2qB0/XHMmGtlsZ8Er19al+aB4OJAJ5yzBU01rVQFVkOLC50ZlYT4VcVgJbOUvRXi8c4mlv0JNfvajA\"}"},
        'cruxID': 'syedhassanashraf@cruxdev.crux',
        'cruxIDSubdomain': 'syedhassanashraf',
        'addressMapping': mockedAddressMapping,
        'decryptedPayIDClaim': {"virtualAddress":"syedhassanashraf@cruxdev.crux", "identitySecrets": {"identityKeyPair":{"pubKey":"033f4f33c1483cb15c58c9ca03b2a0847382b0081290017e28be03b55353f1f6eb","privKey":"850433f3a2f12f0fb890041e1daed6bd491a973ec569936d41ac62cb8441ee51","address":"16DfDLZajnAwRotCx4L1NEkAEAijwsntHV"}}}
    }
    let walletOptions = {
        getEncryptionKey: () => "fookey",
        walletClientName: 'scatter_dev'
    }

    describe('after init tests', () => {

        let httpJSONRequestStub: sinon.SinonStub

        before(() => {
            httpJSONRequestStub = sinon.stub(utils, 'httpJSONRequest').throws('unhandled in mocks')

            requestFixtures.forEach(requestObj => {
                httpJSONRequestStub.withArgs(requestObj.request).returns(requestObj.response)
            });
        })

        after(() => {
            httpJSONRequestStub.restore()
            localStorage.clear();
        })

        describe("getCruxIDState tests", () => {
            it ("no private key provided, should fail", async () => {
                let cruxClient = new CruxClient(walletOptions);
                let raisedError;
                try {
                    let cruxIdState = await cruxClient.getCruxIDState()
                } catch (error) {
                    raisedError = error;
                }
                expect(raisedError.errorCode).to.be.equal(PackageErrorCode.PrivateKeyRequired)
            })
        })

        describe("registerCruxID tests", () => {
            it ("no private key provided, should fail", async () => {
                let cruxClient = new CruxClient(walletOptions);
                const subdomain = "testsubdomain";
                let raisedError;
                try {
                    let cruxIdState = await cruxClient.registerCruxID(subdomain);
                } catch (error) {
                    raisedError = error;
                }
                expect(raisedError.errorCode).to.be.equal(PackageErrorCode.PrivateKeyRequired)
            })

            it("invalid name/subdomain 'cs1' provided", async () => {
                // Mocks

                // Initialising the CruxClient
                let cruxClient = new CruxClient(Object.assign({
                    privateKey: sampleUser.decryptedPayIDClaim.identitySecrets.identityKeyPair.privKey
                }, walletOptions));
                await cruxClient.init();

                // registerCruxID
                const subdomain = "cs1";
                let raisedError;
                try {
                    await cruxClient.registerCruxID(subdomain);
                } catch(error) {
                    raisedError = error
                }

                // Expectations
                expect(raisedError.errorCode).to.be.equal(PackageErrorCode.SubdomainLengthCheckFailure)

            })
            it("unavailable subdomain 'test' provided", async () => {
                // Mocks

                // Initialising the CruxClient
                let cruxClient = new CruxClient(Object.assign({
                    privateKey: sampleUser.decryptedPayIDClaim.identitySecrets.identityKeyPair.privKey
                }, walletOptions));
                await cruxClient.init();

                // stubbing runtime property
                const isCruxIDAvailableStub = sinon.stub(cruxClient, 'isCruxIDAvailable').resolves(false);

                // registerCruxID
                const subdomain = "test";
                let raisedError;
                try {
                    await cruxClient.registerCruxID(subdomain);
                } catch(error) {
                    raisedError = error
                }

                // Expectations
                expect(isCruxIDAvailableStub.calledWith(subdomain)).is.true
                expect(isCruxIDAvailableStub.calledOnce).is.true
                expect(raisedError.errorCode).to.be.equal(PackageErrorCode.CruxIDUnavailable)

            })
            it("registration failure with NameService error", async () => {
                // Mocks
                localStorage.clear();

                // Initialising the CruxClient
                let cruxClient = new CruxClient(Object.assign({
                    privateKey: sampleUser.decryptedPayIDClaim.identitySecrets.identityKeyPair.privKey
                }, walletOptions));
                await cruxClient.init();

                // stubbing runtime property
                const isCruxIDAvailableStub = sinon.stub(cruxClient, 'isCruxIDAvailable').resolves(true);
                // @ts-ignore
                const nameServiceRegisterNameStub = sinon.stub(cruxClient._nameService, 'registerName').rejects(ErrorHelper.getPackageError(null, PackageErrorCode.GaiaProfileUploadFailed));

                // registerCruxID
                const subdomain = "test";
                let raisedError;
                try {
                    await cruxClient.registerCruxID(subdomain);
                } catch(error) {
                    raisedError = error
                }

                // Expectations
                let identityClaim = {secrets: sampleUser['decryptedPayIDClaim'].identitySecrets}

                expect(isCruxIDAvailableStub.calledWith(subdomain)).is.true
                expect(isCruxIDAvailableStub.calledOnce).is.true
                expect(nameServiceRegisterNameStub.calledWith(identityClaim, subdomain)).is.true
                expect(nameServiceRegisterNameStub.calledOnce).is.true
                expect(raisedError.errorCode).to.be.equal(PackageErrorCode.GaiaProfileUploadFailed)

            })
            it("successful registration", async () => {
                // Mocks
                localStorage.clear();

                // Initialising the CruxClient
                let cruxClient = new CruxClient(Object.assign(walletOptions, {
                    privateKey: sampleUser.decryptedPayIDClaim.identitySecrets.identityKeyPair.privKey
                }));
                await cruxClient.init();

                // stubbing runtime property
                const isCruxIDAvailableStub = sinon.stub(cruxClient, 'isCruxIDAvailable').resolves(true);
                // @ts-ignore
                const nameServiceRegisterNameStub = sinon.stub(cruxClient._nameService, 'registerName').resolves("test@scatter_dev.crux");

                // registerCruxID
                const subdomain = "test";
                let registrationPromise = await cruxClient.registerCruxID(subdomain);

                // Expectations
                const identityClaim = {secrets: sampleUser['decryptedPayIDClaim'].identitySecrets}
                const virtualAddress = "test@scatter_dev.crux";

                expect(isCruxIDAvailableStub.calledWith(subdomain)).is.true
                expect(isCruxIDAvailableStub.calledOnce).is.true
                expect(nameServiceRegisterNameStub.calledWith(identityClaim, subdomain)).is.true
                expect(nameServiceRegisterNameStub.calledOnce).is.true
                expect(registrationPromise).to.be.undefined
                // @ts-ignore
                expect(cruxClient._payIDClaim.virtualAddress).is.to.equal(virtualAddress);
                // @ts-ignore
                expect(cruxClient._payIDClaim.identitySecrets).to.be.a('string');

            })
        })

        describe("subdomain currency address resolution", () => {
            it("positive case, exposed asset", async () => {
                localStorage.clear();
                localStorage.setItem('payIDClaim', JSON.stringify(sampleUser['payIDClaim']))
                let cruxClient = new CruxClient(walletOptions);
                await cruxClient.init()
                let mockedSampleAddress = sampleUser['addressMapping']

                let mockedRevserseClientMapping = {'1d6e1a99-1e77-41e1-9ebb-0e216faa166a': 'btc' }

                let clientMappingStub = sinon.stub(cruxClient._configService, 'reverseClientAssetMapping').value(mockedRevserseClientMapping)
                let addressMappingStub = sinon.stub(cruxClient._nameService, 'getAddressMapping').returns(mockedSampleAddress)

                let resolvedAddress = await cruxClient.resolveCurrencyAddressForCruxID(sampleUser['cruxID'], "btc")
                expect(resolvedAddress.addressHash).to.equal('19m51F8YkjzK625csaNtKnM9pgByeMJRU3')
                clientMappingStub.restore()
                addressMappingStub.restore()
            })

            it("unexposed asset in client-mapping", async () => {
                localStorage.clear();
                localStorage.setItem('payIDClaim', JSON.stringify(sampleUser['payIDClaim']))
                let cruxClient = new CruxClient(walletOptions);
                await cruxClient.init()
                let mockedSampleAddress = sampleUser['addressMapping']

                let mockedClientMapping = {'1d6e1a99-1e77-41e1-9ebb-0e216faa166a': 'btc' }

                let clientMappingStub = sinon.stub(cruxClient._configService, 'reverseClientAssetMapping').value(mockedClientMapping)
                let addressMappingStub = sinon.stub(cruxClient._nameService, 'getAddressMapping').returns(mockedSampleAddress)
                let raisedException = false
                try {
                    await cruxClient.resolveCurrencyAddressForCruxID(sampleUser['cruxID'], "ZRX")
                } catch(e) {
                    raisedException = true
                    expect(e.errorCode).to.equal(1006)
                } finally {
                    expect(raisedException).to.equal(true)
                    clientMappingStub.restore()
                    addressMappingStub.restore()
                }
            })

            it("unexposed asset by subdomain", async () => {
                localStorage.clear();
                localStorage.setItem('payIDClaim', JSON.stringify(sampleUser['payIDClaim']))
                let cruxClient = new CruxClient(walletOptions);
                await cruxClient.init()
                let mockedSampleAddress = {"1234567-1e77-41e1-9ebb-0e216faa166a": {addressHash: "19m51F8YkjzK625csaNtKnM9pgByeMJRU3"}}

                let mockedClientMapping = {'1d6e1a99-1e77-41e1-9ebb-0e216faa166a': 'btc' }

                let clientMappingStub = sinon.stub(cruxClient._configService, 'reverseClientAssetMapping').value(mockedClientMapping)
                let addressMappingStub = sinon.stub(cruxClient._nameService, 'getAddressMapping').returns(mockedSampleAddress)
                let raisedException = false
                try {
                    await cruxClient.resolveCurrencyAddressForCruxID(sampleUser['cruxID'], "btc")
                } catch(e) {
                    raisedException = true
                    expect(e.errorCode).to.equal(1005)
                } finally {
                    expect(raisedException).to.equal(true)
                    clientMappingStub.restore()
                    addressMappingStub.restore()
                }
            })
        })

        describe("address mapping tests", () => {
            it("positive case, get address map", async () => {
                let cruxClient = new CruxClient(Object.assign(walletOptions, {
                    privateKey: sampleUser.decryptedPayIDClaim.identitySecrets.identityKeyPair.privKey
                }));
                await cruxClient.init()
                cruxClient._payIDClaim = new PayIDClaim(sampleUser.payIDClaim, { getEncryptionKey: () => "fookey" });
                let mockedClientMapping = {'1d6e1a99-1e77-41e1-9ebb-0e216faa166a': 'btc' }
                let clientMappingStub = sinon.stub(cruxClient._configService, 'reverseClientAssetMapping').value(mockedClientMapping)
                let addressMappingStub = sinon.stub(cruxClient._nameService, 'getAddressMapping').resolves(sampleUser['addressMapping'])
                let gotAddMap = await cruxClient.getAddressMap()
                expect(gotAddMap.btc.addressHash).to.equal('19m51F8YkjzK625csaNtKnM9pgByeMJRU3')
                clientMappingStub.restore()
                addressMappingStub.restore()
            })

            it("put address map, gaia upload call failed", async () => {
                localStorage.setItem('payIDClaim', JSON.stringify(sampleUser['payIDClaim']))
                let cruxClient = new CruxClient(Object.assign(walletOptions, {
                    privateKey: sampleUser.decryptedPayIDClaim.identitySecrets.identityKeyPair.privKey
                }));
                await cruxClient.init()
                cruxClient._payIDClaim = new PayIDClaim(sampleUser.payIDClaim, { getEncryptionKey: () => "fookey" });
                let raisesException = false
                let updateProfileStub = sinon.stub(cruxClient._nameService, 'putAddressMapping').rejects(ErrorHelper.getPackageError(null, PackageErrorCode.GaiaProfileUploadFailed))
                try {
                    await cruxClient.putAddressMap(sampleAddressMap)
                } catch(e) {
                    raisesException = true
                    expect(e.errorCode).to.equal(2005)
                } finally {
                    expect(raisesException).to.be.true
                    updateProfileStub.restore()
                }
            })
        })
        describe("putAddressMap tests", () => {
            it("all currencies provided exist in client mapping", async () => {
                // Mocks
                let mockedAddressMap = sampleAddressMap;

                // Initialising the CruxClient
                let cruxClient = new CruxClient(Object.assign(walletOptions, {
                    privateKey: sampleUser.decryptedPayIDClaim.identitySecrets.identityKeyPair.privKey
                }));
                await cruxClient.init();
                cruxClient._payIDClaim = new PayIDClaim(sampleUser.payIDClaim, { getEncryptionKey: () => "fookey" });

                // stubbing runtime property
                // @ts-ignore
                const nameServicePutAddressMappingStub = sinon.stub(cruxClient._nameService, 'putAddressMapping').resolves();

                // putAddressMap
                const {success, failures} = await cruxClient.putAddressMap(mockedAddressMap)

                // Expectations
                let decrpytedPayIDClaim = {secrets: {identityKeyPair: {privKey: sampleUser["decryptedPayIDClaim"].identitySecrets.identityKeyPair.privKey+"01", pubKey: sampleUser["decryptedPayIDClaim"].identitySecrets.identityKeyPair.pubKey, address: sampleUser["decryptedPayIDClaim"].identitySecrets.identityKeyPair.address}, mnemonic: "cricket alpha globe noise crumble culture real beauty alert achieve erase snap"}};
                let assetIdMap = {"1d6e1a99-1e77-41e1-9ebb-0e216faa166a": sampleAddressMap["BTC"], "508b8f73-4b06-453e-8151-78cb8cfc3bc9": sampleAddressMap["ETH"]};
                let successCurrencies = {"btc": sampleAddressMap["BTC"], "eth": sampleAddressMap["ETH"]};

                expect(nameServicePutAddressMappingStub.calledWith(decrpytedPayIDClaim, assetIdMap)).is.true;
                expect(nameServicePutAddressMappingStub.calledOnce).is.true;
                expect(failures).is.empty;
                expect(success).to.be.eql(successCurrencies);

            })
            it("all currencies provided do not exist in client mapping", async () => {
                // Mocks
                let mockedAddressMap = {
                    ZRX: {
                        addressHash: '0x0a2311594059b468c9897338b027c8782398b481'
                    }
                };

                // Initialising the CruxClient
                let cruxClient = new CruxClient(Object.assign(walletOptions, {
                    privateKey: sampleUser.decryptedPayIDClaim.identitySecrets.identityKeyPair.privKey
                }));
                await cruxClient.init();
                cruxClient._payIDClaim = new PayIDClaim(sampleUser.payIDClaim, { getEncryptionKey: () => "fookey" });

                // stubbing runtime property
                // @ts-ignore
                const nameServicePutAddressMappingStub = sinon.stub(cruxClient._nameService, 'putAddressMapping').resolves();

                // putAddressMap
                const {success, failures} = await cruxClient.putAddressMap(mockedAddressMap)

                // Expectations
                expect(nameServicePutAddressMappingStub.calledOnce).is.true;
                expect(failures.zrx).to.include(PackageErrorCode.CurrencyDoesNotExistInClientMapping);
                expect(success).is.empty;

            })
            it("some of the currencies provided do not exist in client mapping", async () => {
                // Mocks
                let mockedAddressMap = {
                    BTC: sampleAddressMap["BTC"],
                    ZRX: {
                        addressHash: '0x0a2311594059b468c9897338b027c8782398b481'
                    }
                };

                // Initialising the CruxClient
                let cruxClient = new CruxClient(Object.assign(walletOptions, {
                    privateKey: sampleUser.decryptedPayIDClaim.identitySecrets.identityKeyPair.privKey
                }));
                await cruxClient.init();
                cruxClient._payIDClaim = new PayIDClaim(sampleUser.payIDClaim, { getEncryptionKey: () => "fookey" });

                // stubbing runtime property
                // @ts-ignore
                const nameServicePutAddressMappingStub = sinon.stub(cruxClient._nameService, 'putAddressMapping').resolves();

                // putAddressMap
                const {success, failures} = await cruxClient.putAddressMap(mockedAddressMap)

                // Expectations
                let decrpytedPayIDClaim = {secrets: {identityKeyPair: {privKey: sampleUser["decryptedPayIDClaim"].identitySecrets.identityKeyPair.privKey+"01", pubKey: sampleUser["decryptedPayIDClaim"].identitySecrets.identityKeyPair.pubKey, address: sampleUser["decryptedPayIDClaim"].identitySecrets.identityKeyPair.address}, mnemonic: "cricket alpha globe noise crumble culture real beauty alert achieve erase snap"}};
                let assetIdMap = {"1d6e1a99-1e77-41e1-9ebb-0e216faa166a": sampleAddressMap["BTC"]};
                let successCurrencies = {"btc": sampleAddressMap["BTC"]};

                expect(nameServicePutAddressMappingStub.calledWith(decrpytedPayIDClaim, assetIdMap)).is.true;
                expect(nameServicePutAddressMappingStub.calledOnce).is.true;
                expect(failures.zrx).to.include(PackageErrorCode.CurrencyDoesNotExistInClientMapping);
                expect(success).to.be.eql(successCurrencies);

            })
        })
    })

})
