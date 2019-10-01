import { expect } from 'chai';
import sinon from "sinon";
import 'mocha';

import { nameservice, identityUtils, errors } from "../packages";
import * as utils from "../packages/utils";
import requestFixtures from "./requestMocks/nameservice-reqmocks";
import * as blockstack from 'blockstack';
import { IAddressMapping } from '../index';
import { config } from 'blockstack';
import { ErrorHelper } from 'src/packages/error';


// TODO: registration of already registered names and error handling
// TODO: resolving addresses with invalid name/id


describe('BlockstackService tests', () => {
  let blockstackService = new nameservice.BlockstackService()

  let httpJSONRequestStub: sinon.SinonStub
  let connectToGaiaHubStub: sinon.SinonStub
  let uploadToGaiaHubStub: sinon.SinonStub

  // sample identity claim for 'cs1'
  let sampleSubdomain = 'cs1'
  let sampleCruxId = 'cs1@devcoinswitch.crux'
  let sampleIdentityClaim = {
    secrets: {
      mnemonic: "jelly level auction pluck system record unique huge text fold galaxy home",
      identityKeyPair: {
        privKey: "6bd397dc89272e71165a0e7d197b280c7a88ed5b1e44e1928c25455506f1968f",
        pubKey: "02bc9c3f8e924b7de9212cebd0129f1be2e6c3f2904e911b30698bde77be4878b8",
        address: "1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ"
      }
    }
  }
  let sampleAddressMap: IAddressMapping = {
    "BTC": {
      addressHash: "1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ"
    }
  }

  beforeEach(() => {
    // Handling mock stubs

    httpJSONRequestStub = sinon.stub(utils, 'httpJSONRequest').throws('unhandled in mocks')
    connectToGaiaHubStub = sinon.stub(blockstack, 'connectToGaiaHub').resolves({ address: "mock_address", url_prefix: "mock_url_prefix", token: "mock_token", server: "mock_server" })
    uploadToGaiaHubStub = sinon.stub(blockstack, 'uploadToGaiaHub').resolves("mocked zonefile URL")


    requestFixtures.forEach(requestObj => {
      httpJSONRequestStub.withArgs(requestObj.request).returns(requestObj.response)
    })

  })

  afterEach(() => {
    httpJSONRequestStub.restore()
    connectToGaiaHubStub.restore()
    uploadToGaiaHubStub.restore()
  })

  // Test cases

  describe('generateIdentity tests', () => {
    it('always generates a proper identity claim (mnemonic and a keypair)', async () => {
      let generatedIdentityClaim = await blockstackService.generateIdentity()
      expect(generatedIdentityClaim).haveOwnProperty('secrets').haveOwnProperty('mnemonic').to.be.a('string')
      expect(generatedIdentityClaim).haveOwnProperty('secrets').haveOwnProperty('identityKeyPair').haveOwnProperty('pubKey').to.be.a('string')
      expect(generatedIdentityClaim).haveOwnProperty('secrets').haveOwnProperty('identityKeyPair').haveOwnProperty('privKey').to.be.a('string')
      expect(generatedIdentityClaim).haveOwnProperty('secrets').haveOwnProperty('identityKeyPair').haveOwnProperty('address').to.be.a('string')
    })
  })

  describe('restoreIdentity tests', () => {
    it('given cruxID and identityClaim with mnemonic, should return the corresponding full identityClaim', async () => {
      let restoredIdentityClaim = await blockstackService.restoreIdentity(sampleCruxId, sampleIdentityClaim)
      expect(restoredIdentityClaim).haveOwnProperty('secrets').haveOwnProperty('mnemonic').to.be.a('string')
      expect(restoredIdentityClaim).haveOwnProperty('secrets').haveOwnProperty('identityKeyPair').haveOwnProperty('pubKey').to.be.a('string')
      expect(restoredIdentityClaim).haveOwnProperty('secrets').haveOwnProperty('identityKeyPair').haveOwnProperty('privKey').to.be.a('string')
      expect(restoredIdentityClaim).haveOwnProperty('secrets').haveOwnProperty('identityKeyPair').haveOwnProperty('address').to.be.a('string')
    })
    it('given curxID without identityClaim, should throw "CouldNotFindMnemonicToRestoreIdentity"')
    it('given identityClaim with mnemonic with invalid cruxID, should throw "CruxIdLengthValidation" | "CruxIdNamespaceValidation"')
    it('given identityClaim with mnemonic and non-corresponding cruxID, should throw error')
  })

  describe('PrivateKey sanitization tests', () => {
    let uncompressedKey = "6bd397dc89272e71165a0e7d197b280c7a88ed5b1e44e1928c25455506f1968f01"
    let compressedKey = "6bd397dc89272e71165a0e7d197b280c7a88ed5b1e44e1928c25455506f1968f"

    it('given an uncompressed key returns compressed key', () => {
      // @ts-ignore
      expect(blockstackService._sanitizePrivKey(uncompressedKey)).to.equal(compressedKey)
    })

    it('given an compressed key returns compressed key', () => {
      // @ts-ignore
      expect(blockstackService._sanitizePrivKey(compressedKey)).to.equal(compressedKey)
    })
  })

  describe('getNameAvailability tests', () => {
    let registeredSubdomain = 'cs1'
    let unregisteredSubdomain = 'example'

    it(`${registeredSubdomain}@devcoinswitch.crux should be unavailable`, async () => {
      let resolvedPublicKey = await blockstackService.getNameAvailability(registeredSubdomain)
      let options = {
        baseUrl: "https://registrar.coinswitch.co:3000",
        json: true,
        method: "GET",
        url: `/status/${registeredSubdomain}`,
      }
      expect(httpJSONRequestStub.calledOnce).is.true
      expect(httpJSONRequestStub.calledWith(options)).is.true
      expect(resolvedPublicKey).is.false
    })
    it(`${unregisteredSubdomain}@devcoinswitch.crux should be available`, async () => {
      let resolvedPublicKey = await blockstackService.getNameAvailability(unregisteredSubdomain)
      let options = {
        baseUrl: "https://registrar.coinswitch.co:3000",
        json: true,
        method: "GET",
        url: `/status/${unregisteredSubdomain}`,
      }
      expect(httpJSONRequestStub.calledOnce).is.true
      expect(httpJSONRequestStub.calledWith(options)).is.true
      expect(resolvedPublicKey).is.true
    })

  })

  describe('getRegistrationStatus tests', () => {
    let unavailableStatus = {
      'status': 'NONE',
      'status_detail': ''
    }
    let pendingStatus = {
      'status': 'PENDING',
      'status_detail': 'Subdomain registration pending on registrar.'
    };
    let registeredStatus = {
      'status': 'DONE',
      'status_detail': 'Subdomain propagated.'
    };
    it('given identityClaim, without restoring identity, should return NONE', async () => {
      // initialise the nameservice
      let bs = new nameservice.BlockstackService()
      // fetch registrationStatus
      let resolvedStatus = await bs.getRegistrationStatus(sampleIdentityClaim);
      expect(httpJSONRequestStub.notCalled).is.true
      expect(resolvedStatus).to.eql(unavailableStatus)
    })
    it('given pending identityClaim (carol@devcoinswitch.crux), after restoring the identity, should return PENDING', async () => {
      let pendingCruxId = "carol@devcoinswitch.crux";
      let pendingIdentityClaim = { "secrets": { "identityKeyPair": { "address": "1FnntbZKRLB7rZFvng9PDgvMMEXMek1jrv", "privKey": "d4f1d65bbe0a89a91506828f4e62639b99558aeffda06b6f66961dccec5e301b01", "pubKey": "03d2b5b73bd06b624ccd24d05d0ffc259e7b9180d85b29f61e16404866fe344e60" }, "mnemonic": "minute furnace room favorite hunt auto scrap angry tribe wait foam drive" } }
      let bnsRequestOptions1 = {
        baseUrl: 'https://core.blockstack.org',
        json: true,
        method: "GET",
        url: `/v1/names/carol.devcoinswitch.id`,
      }
      let bnsRequestOptions2 = {
        baseUrl: 'https://bns.cruxpay.com',
        json: true,
        method: "GET",
        url: `/v1/names/carol.devcoinswitch.id`,
      }
      let registrarRequestOptions = {
        baseUrl: "https://registrar.coinswitch.co:3000",
        json: true,
        method: "GET",
        url: `/status/carol`,
      }
      // initialise the nameservice
      let bs = new nameservice.BlockstackService()
      // restore identity
      await bs.restoreIdentity(pendingCruxId, pendingIdentityClaim)
      // fetch registrationStatus
      let resolvedStatus = await bs.getRegistrationStatus(pendingIdentityClaim)
      expect(httpJSONRequestStub.calledThrice).is.true
      expect(httpJSONRequestStub.calledWith(bnsRequestOptions1)).is.true
      expect(httpJSONRequestStub.calledWith(bnsRequestOptions2)).is.true
      expect(httpJSONRequestStub.calledWith(registrarRequestOptions)).is.true
      expect(resolvedStatus).to.eql(pendingStatus)
    })
    it(`given registered identityClaim (cs1@devcoinswitch.crux), after restoring the identity, should return DONE`, async () => {
      let bnsRequestOptions1 = {
        baseUrl: 'https://core.blockstack.org',
        json: true,
        method: "GET",
        url: `/v1/names/cs1.devcoinswitch.id`,
      }
      let bnsRequestOptions2 = {
        baseUrl: 'https://bns.cruxpay.com',
        json: true,
        method: "GET",
        url: `/v1/names/cs1.devcoinswitch.id`,
      }

      // initialise the nameservice
      let bs = new nameservice.BlockstackService();
      // restore the identity using identityClaim
      await bs.restoreIdentity(sampleCruxId, sampleIdentityClaim)
      // fetch registrationStatus
      let resolvedStatus = await bs.getRegistrationStatus(sampleIdentityClaim);
      expect(httpJSONRequestStub.calledTwice).is.true
      expect(httpJSONRequestStub.calledWith(bnsRequestOptions1)).is.true
      expect(httpJSONRequestStub.calledWith(bnsRequestOptions2)).is.true
      expect(resolvedStatus).to.eql(registeredStatus);
    })

  })

  describe('registerName tests', () => {
    let desiredName = 'bob'
    let expectedRegisteredName = 'bob@devcoinswitch.crux'
    let hubInfoRequestOptions = {
      method: 'GET',
      url: "https://hub.cruxpay.com/hub_info",
      json: true
    }
    let registrarRequestOptions = {
      method: 'POST',
      baseUrl: 'https://registrar.coinswitch.co:3000',
      url: '/register',
      headers: { 'Content-Type': 'application/json' },
      body: {
        zonefile:
          '$ORIGIN bob\n$TTL 3600\n_https._tcp URI 10 1 "https://gaia.cruxpay.com/1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ/profile.json"\n',
        name: 'bob',
        owner_address: '1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ'
      },
      json: true,
      strictSSL: false
    }
    let redundantRegistrarRequestOptions = {
      method: 'POST',
      baseUrl: 'https://registrar.coinswitch.co:3000',
      url: '/register',
      headers: { 'Content-Type': 'application/json' },
      body:
      {
        zonefile:
          '$ORIGIN cs1\n$TTL 3600\n_https._tcp URI 10 1 "https://gaia.cruxpay.com/1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ/profile.json"\n',
        name: 'cs1',
        owner_address: '1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ'
      },
      json: true,
      strictSSL: false
    }
    it('given valid identityClaim (only mnemonic) and a non-registered cruxId, should successfully register and return the fullCruxId', async () => {
      let registeredName = await blockstackService.registerName({ secrets: { mnemonic: sampleIdentityClaim.secrets.mnemonic } }, desiredName)
      expect(httpJSONRequestStub.calledTwice).is.true
      expect(httpJSONRequestStub.calledWith(hubInfoRequestOptions)).is.true
      expect(httpJSONRequestStub.calledWith(registrarRequestOptions)).is.true
      expect(registeredName).is.equal(expectedRegisteredName)
    })
    it('given valid identityClaim and a non-registered cruxId (bob@devcoinswitch.crux), should successfully register and return the fullCruxId', async () => {
      let registeredName = await blockstackService.registerName(sampleIdentityClaim, desiredName)
      expect(httpJSONRequestStub.calledTwice).is.true
      expect(httpJSONRequestStub.calledWith(hubInfoRequestOptions)).is.true
      expect(httpJSONRequestStub.calledWith(registrarRequestOptions)).is.true
      expect(registeredName).is.equal(expectedRegisteredName)
    })
    it('given valid identityClaim and a registered cruxId, should throw "SubdomainRegistrationFailed"', async () => {
      uploadToGaiaHubStub.resolves("https://gaia.cruxpay.com/1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ/cruxpay.json")
      let raisedError
      try {
        await blockstackService.registerName(sampleIdentityClaim, sampleSubdomain)
      } catch (error) {
        raisedError = error
      }
      expect(uploadToGaiaHubStub.calledOnce).is.true
      // expect(httpJSONRequestStub.calledOnce).is.true
      expect(uploadToGaiaHubStub.calledWith('profile.json')).is.true
      expect(httpJSONRequestStub.calledWith(redundantRegistrarRequestOptions)).is.true
      expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.SubdomainRegistrationFailed)
    })
  })

  describe('putAddressMapping tests', () => {
    it('given valid identityClaim and valid addressMap, should resolve the promise without errors')
    it('given ')
    it(`upload sample address map for cs1@devcoinswitch.crux`, async () => {
      // mocked values
      connectToGaiaHubStub.resolves({ "url_prefix": "https://gaia.cruxpay.com/", "address": "1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ", "token": "v1:eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJnYWlhQ2hhbGxlbmdlIjoiW1wiZ2FpYWh1YlwiLFwiMFwiLFwic3RvcmFnZTIuYmxvY2tzdGFjay5vcmdcIixcImJsb2Nrc3RhY2tfc3RvcmFnZV9wbGVhc2Vfc2lnblwiXSIsImh1YlVybCI6Imh0dHBzOi8vaHViLmJsb2Nrc3RhY2sub3JnIiwiaXNzIjoiMDJiYzljM2Y4ZTkyNGI3ZGU5MjEyY2ViZDAxMjlmMWJlMmU2YzNmMjkwNGU5MTFiMzA2OThiZGU3N2JlNDg3OGI4Iiwic2FsdCI6ImE0ODk1ZWE1ZjdjZjI2N2VhNDEwMjg2ZjRjNzk4MTY3In0.QFuEEVijDYMKHjERaPA_YXwnwWoBq8iVg4pzEusP0S_u5jSmmxqeJcumyMK8cqT4NTmOYgnMUC4u4-9OAUWOIQ", "server": "https://hub.cruxpay.com" })
      uploadToGaiaHubStub.resolves("https://gaia.cruxpay.com/1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ/cruxpay.json")

      let bs = new nameservice.BlockstackService()
      // @ts-ignore
      bs._subdomain = sampleSubdomain
      let acknowledgement = await blockstackService.putAddressMapping(sampleIdentityClaim, sampleAddressMap)
      console.log(acknowledgement)
      expect(acknowledgement).is.true
    })
  })

  describe('getAddressMapping tests', () => {
    it(`resolve sample address map from cs1@devcoinswitch.crux`, async () => {
      let resolvedAddressMap: IAddressMapping = await blockstackService.getAddressMapping(sampleCruxId)
      console.log(resolvedAddressMap)
      expect(resolvedAddressMap).is.eql(sampleAddressMap)
    })
  })

})
