import { expect } from 'chai';
import sinon from "sinon";
import 'mocha';

import { nameservice, identityUtils } from "../packages";
import * as utils from "../packages/utils";
import requestFixtures from "./requestMocks/nameservice-reqmocks";
import * as blockstack from 'blockstack';
import { IAddressMapping } from '../index';


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

  before(() => {
    // Handling mock stubs

    httpJSONRequestStub = sinon.stub(utils, 'httpJSONRequest').throws('unhandled in mocks')
    connectToGaiaHubStub = sinon.stub(blockstack, 'connectToGaiaHub').resolves({ address: "mock_address", url_prefix: "mock_url_prefix", token: "mock_token", server: "mock_server" })
    uploadToGaiaHubStub = sinon.stub(blockstack, 'uploadToGaiaHub').resolves("mocked zonefile URL")


    requestFixtures.forEach(requestObj => {
      httpJSONRequestStub.withArgs(requestObj.request).returns(requestObj.response)
    })

  })

  after(() => {
    httpJSONRequestStub.restore()
    connectToGaiaHubStub.restore()
    uploadToGaiaHubStub.restore()
  })

  // Test cases

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
      console.log(resolvedPublicKey)
      expect(resolvedPublicKey).is.false
    })
    it(`${unregisteredSubdomain}@devcoinswitch.crux should be available`, async () => {
      let resolvedPublicKey = await blockstackService.getNameAvailability(unregisteredSubdomain)
      console.log(resolvedPublicKey)
      expect(resolvedPublicKey).is.true
    })

  })

  describe('getRegistrationStatus tests', () => {
    it(`registration status for cs1@devcoinswitch.crux is DONE`, async () => {
      let bs = new nameservice.BlockstackService();
      let name = 'cs1'
      let walletClientName = 'devcoinswitch'
      let registrationStatus = {
        'status': 'DONE',
        'status_detail': 'Subdomain propagated.'
      };

      // @ts-ignore
      bs._subdomain = name;
      // @ts-ignore
      bs._identityCouple = {
        cruxId: new identityUtils.CruxId({
          subdomain: name,
          domain: walletClientName
        }),
        bsId: new identityUtils.BlockstackId({
          subdomain: name,
          domain: walletClientName
        })
      }

      let resolvedStatus = await bs.getRegistrationStatus(sampleIdentityClaim);
      console.log(resolvedStatus == registrationStatus);
      expect(resolvedStatus).to.eql(registrationStatus);
    })

  })

  describe('registerName tests', () => {
    it('register a new cruxID bob@devcoinswitch.crux', async () => {
      let desiredName = 'bob'
      let expectedRegisteredName = 'bob@devcoinswitch.crux'

      let registeredName = await blockstackService.registerName(sampleIdentityClaim, desiredName)
      expect(registeredName).is.equal(expectedRegisteredName)
    })
  })

  describe('putAddressMapping tests', () => {
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
