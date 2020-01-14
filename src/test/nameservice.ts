import { expect } from 'chai';
import sinon from "sinon";
import 'mocha';

import config from "../config";
import {blockstackService, errors, inmemStorage} from "../packages";
import * as utils from "../packages/utils";
import requestFixtures from "./requestMocks/nameservice-reqmocks";
import * as blockstack from 'blockstack';
import {cacheStorage, IAddressMapping} from '../index';
import { sanitizePrivKey } from "../packages/utils";
import { UPLOADABLE_JSON_FILES } from '../packages/name-service/blockstack-service';
import { getCruxIDByAddress } from '../packages/name-service/utils';
import { LocalStorage } from '../packages/storage';


// TODO: registration of already registered names and error handling
// TODO: resolving addresses with invalid name/id

const nameservice_options: blockstackService.IBlockstackServiceInputOptions = {
  bnsNodes: config.BLOCKSTACK.BNS_NODES,
  domain: "devcoinswitch_crux",
  gaiaHub: config.BLOCKSTACK.GAIA_HUB,
  subdomainRegistrar: config.BLOCKSTACK.SUBDOMAIN_REGISTRAR,
};

describe('BlockstackService tests', () => {
  let blkstkService = new blockstackService.BlockstackService(nameservice_options)
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
  let sampleIdentityClaimWithoutKeyPair = {
    secrets: {
      identityKeyPair: undefined
    }
  }
  let sampleAddressMap: IAddressMapping = {
    "BTC": {
      addressHash: "1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ"
    }
  }

  beforeEach(() => {
    // @ts-ignore
    cacheStorage = new LocalStorage();
    localStorage.clear();
    
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
    localStorage.clear()
    // @ts-ignore
    cacheStorage = undefined;
  })

  // Test cases

  describe('restoreIdentity tests', () => {
    it('given cruxID and identityClaim with mnemonic, should return the corresponding full identityClaim', async () => {
      let restoredIdentityClaim = await blkstkService.restoreIdentity(sampleCruxId, sampleIdentityClaim)
      expect(restoredIdentityClaim).haveOwnProperty('secrets').haveOwnProperty('identityKeyPair').haveOwnProperty('pubKey').to.be.a('string')
      expect(restoredIdentityClaim).haveOwnProperty('secrets').haveOwnProperty('identityKeyPair').haveOwnProperty('privKey').to.be.a('string')
      expect(restoredIdentityClaim).haveOwnProperty('secrets').haveOwnProperty('identityKeyPair').haveOwnProperty('address').to.be.a('string')
    })
    it('given cruxID without identityClaim, should throw "CouldNotFindKeyPairToRestoreIdentity"', async () => {
      let raisedError;
      try {
        let restoredIdentityClaim = await blkstkService.restoreIdentity(sampleCruxId, {secrets: {}})
      } catch (error) {
        raisedError = error
      }
      expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.CouldNotFindKeyPairToRestoreIdentity)
    })
    it('given identityClaim without keypair, should throw "CouldNotFindKeyPairToRestoreIdentity"', async() => {
      let raisedError
        try {
          let restoredIdentityClaimWithoutMnemonic = await blkstkService.restoreIdentity(sampleCruxId, sampleIdentityClaimWithoutKeyPair)
        }
        catch (error) {
          raisedError = error
        }
        expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.CouldNotFindKeyPairToRestoreIdentity)
    })
  })

  describe('PrivateKey sanitization tests', () => {
    let uncompressedKey = "6bd397dc89272e71165a0e7d197b280c7a88ed5b1e44e1928c25455506f1968f01"
    let compressedKey = "6bd397dc89272e71165a0e7d197b280c7a88ed5b1e44e1928c25455506f1968f"

    it('given an uncompressed key returns compressed key', () => {
      // @ts-ignore
      expect(sanitizePrivKey(uncompressedKey)).to.equal(compressedKey)
    })

    it('given an compressed key returns compressed key', () => {
      // @ts-ignore
      expect(sanitizePrivKey(compressedKey)).to.equal(compressedKey)
    })
  })

  describe('getNameAvailability tests', () => {
    let registeredSubdomain = 'cs1'
    let unregisteredSubdomain = 'example'

    it(`${registeredSubdomain}@devcoinswitch.crux should be unavailable`, async () => {
      let resolvedPublicKey = await blkstkService.getNameAvailability(registeredSubdomain)
      let options = {
        baseUrl: "https://registrar.coinswitch.co:3000",
        headers: {'x-domain-name': 'devcoinswitch_crux'},
        json: true,
        method: "GET",
        url: `/status/${registeredSubdomain}`,
      }
      expect(httpJSONRequestStub.calledOnce).is.true
      expect(httpJSONRequestStub.calledWith(options)).is.true
      expect(resolvedPublicKey).is.false
    })
    it(`${unregisteredSubdomain}@devcoinswitch.crux should be available`, async () => {
      let resolvedPublicKey = await blkstkService.getNameAvailability(unregisteredSubdomain)
      let options = {
        baseUrl: "https://registrar.coinswitch.co:3000",
        headers: {'x-domain-name': 'devcoinswitch_crux'},
        json: true,
        method: "GET",
        url: `/status/${unregisteredSubdomain}`,
      }
      expect(httpJSONRequestStub.calledOnce).is.true
      expect(httpJSONRequestStub.calledWith(options)).is.true
      expect(resolvedPublicKey).is.true
    })

  })

  describe('getDomainAvailability tests', () => {
    let registeredDomain = 'cruxdev'
    let unregisteredDomain = 'example'

    it(`${registeredDomain}.crux should be unavailable`, async () => {
      let domainAvailability = await blkstkService.getDomainAvailability(registeredDomain)
      let options = {
        "baseUrl":"https://core.blockstack.org",
        "json":true,
        "method":"GET",
        "url":`/v1/names/${registeredDomain}_crux.id`
      }
      expect(httpJSONRequestStub.calledOnce).is.true
      expect(httpJSONRequestStub.calledWith(options)).is.true
      expect(domainAvailability).is.false
    })
    it(`${unregisteredDomain}.crux should be available`, async () => {
      let domainAvailability = await blkstkService.getDomainAvailability(unregisteredDomain)
      let options = {
        "baseUrl":"https://core.blockstack.org",
        "json":true,
        "method":"GET",
        "url":`/v1/names/${unregisteredDomain}_crux.id`
      }
      expect(httpJSONRequestStub.calledOnce).is.true
      expect(httpJSONRequestStub.calledWith(options)).is.true
      expect(domainAvailability).is.true
    })

  })

  describe('getRegistrationStatus tests', () => {
    let unavailableStatus = { 
      'status': 'NONE',
      'statusDetail': ''
    }
    let pendingStatus = {
      'status': 'PENDING',
      'statusDetail': 'Subdomain registration pending on blockchain.'
    };
    let registeredStatus = {
      'status': 'DONE',
      'statusDetail': 'Subdomain propagated.'
    };
    let noneStatus = {
      'status': 'NONE',
      'statusDetail': 'Subdomain not registered with this registrar.'
    }
    let registrarPendingStatus = {
      'status': 'PENDING',
      'statusDetail': 'Subdomain registration pending on registrar.'
    };
    let rejectStatus = {
      'status': 'REJECT',
      'statusDetail': ''
    }

    it('given identityClaim, without restoring identity, should return NONE', async () => {
      // initialise the nameservice
      let bs = new blockstackService.BlockstackService(nameservice_options)
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
        url: `/v1/names/carol.devcoinswitch_crux.id`,
        qs: sinon.match.any
      }
      let bnsRequestOptions2 = {
        baseUrl: 'https://bns.cruxpay.com',
        json: true,
        method: "GET",
        url: `/v1/names/carol.devcoinswitch_crux.id`,
        qs: sinon.match.any
      }
      let registrarRequestOptions = {
        baseUrl: "https://registrar.coinswitch.co:3000",
        headers: {'x-domain-name': 'devcoinswitch_crux'},
        json: true,
        method: "GET",
        url: `/status/carol`,
      }
      // initialise the nameservice
      let bs = new blockstackService.BlockstackService(nameservice_options)
      // restore identity
      await bs.restoreIdentity(pendingCruxId, pendingIdentityClaim)
      // fetch registrationStatus
      let resolvedStatus = await bs.getRegistrationStatus(pendingIdentityClaim)
      expect(httpJSONRequestStub.callCount).to.equal(5)
      expect(httpJSONRequestStub.calledWith(bnsRequestOptions1)).is.true
      expect(httpJSONRequestStub.calledWith(bnsRequestOptions2)).is.true
      expect(httpJSONRequestStub.calledWith(registrarRequestOptions)).is.true
      expect(resolvedStatus).to.eql(pendingStatus)
    })

    it('given any identityClaim (carol1@devcoinswitch.crux), if registration status does not match, return NONE', async () => {
      let pendingCruxId = "carol1@devcoinswitch.crux";
      let pendingIdentityClaim = { "secrets": { "identityKeyPair": { "address": "1FnntbZKRLB7rZFvng9PDgvMMEXMek1jrv", "privKey": "d4f1d65bbe0a89a91506828f4e62639b99558aeffda06b6f66961dccec5e301b01", "pubKey": "03d2b5b73bd06b624ccd24d05d0ffc259e7b9180d85b29f61e16404866fe344e60" }, "mnemonic": "minute furnace room favorite hunt auto scrap angry tribe wait foam drive" } }
      let bnsRequestOptions1 = {
        baseUrl: 'https://core.blockstack.org',
        json: true,
        method: "GET",
        url: `/v1/names/carol1.devcoinswitch_crux.id`,
        qs: sinon.match.any
      }
      let bnsRequestOptions2 = {
        baseUrl: 'https://bns.cruxpay.com',
        json: true,
        method: "GET",
        url: `/v1/names/carol1.devcoinswitch_crux.id`,
        qs: sinon.match.any
      }
      let registrarRequestOptions = {
        baseUrl: "https://registrar.coinswitch.co:3000",
        headers: {'x-domain-name': 'devcoinswitch_crux'},
        json: true,
        method: "GET",
        url: `/status/carol1`,
      }
      // initialise the nameservice
      let bs = new blockstackService.BlockstackService(nameservice_options)
      // restore identity
      await bs.restoreIdentity(pendingCruxId, pendingIdentityClaim)
      // fetch registrationStatus
      let resolvedStatus = await bs.getRegistrationStatus(pendingIdentityClaim)
      expect(httpJSONRequestStub.callCount).to.equal(5)
      expect(httpJSONRequestStub.calledWith(bnsRequestOptions1)).is.true
      expect(httpJSONRequestStub.calledWith(bnsRequestOptions2)).is.true
      expect(httpJSONRequestStub.calledWith(registrarRequestOptions)).is.true
      expect(resolvedStatus).to.eql(unavailableStatus)
    })

    it('given not registered identityClaim (carol2@devcoinswitch.crux), should return NONE', async () => {
      let pendingCruxId = "carol2@devcoinswitch.crux";
      let pendingIdentityClaim = { "secrets": { "identityKeyPair": { "address": "1FnntbZKRLB7rZFvng9PDgvMMEXMek1jrv", "privKey": "d4f1d65bbe0a89a91506828f4e62639b99558aeffda06b6f66961dccec5e301b01", "pubKey": "03d2b5b73bd06b624ccd24d05d0ffc259e7b9180d85b29f61e16404866fe344e60" }, "mnemonic": "minute furnace room favorite hunt auto scrap angry tribe wait foam drive" } }
      let bnsRequestOptions1 = {
        baseUrl: 'https://core.blockstack.org',
        json: true,
        method: "GET",
        url: `/v1/names/carol2.devcoinswitch_crux.id`,
        qs: sinon.match.any
      }
      let bnsRequestOptions2 = {
        baseUrl: 'https://bns.cruxpay.com',
        json: true,
        method: "GET",
        url: `/v1/names/carol2.devcoinswitch_crux.id`,
        qs: sinon.match.any
      }
      let registrarRequestOptions = {
        baseUrl: "https://registrar.coinswitch.co:3000",
        headers: {'x-domain-name': 'devcoinswitch_crux'},
        json: true,
        method: "GET",
        url: `/status/carol2`,
      }
      // initialise the nameservice
      let bs = new blockstackService.BlockstackService(nameservice_options)
      // restore identity
      await bs.restoreIdentity(pendingCruxId, pendingIdentityClaim)
      // fetch registrationStatus
      let resolvedStatus = await bs.getRegistrationStatus(pendingIdentityClaim)
      expect(httpJSONRequestStub.callCount).to.equal(5)
      expect(httpJSONRequestStub.calledWith(bnsRequestOptions1)).is.true
      expect(httpJSONRequestStub.calledWith(bnsRequestOptions2)).is.true
      expect(httpJSONRequestStub.calledWith(registrarRequestOptions)).is.true
      expect(resolvedStatus).to.eql(noneStatus)
    })
    it(`given registered identityClaim (cs1@devcoinswitch.crux), after restoring the identity, should return DONE`, async () => {
      let bnsRequestOptions1 = {
        baseUrl: 'https://core.blockstack.org',
        json: true,
        method: "GET",
        url: `/v1/names/cs1.devcoinswitch_crux.id`,
        qs: sinon.match.any
      }
      let bnsRequestOptions2 = {
        baseUrl: 'https://bns.cruxpay.com',
        json: true,
        method: "GET",
        url: `/v1/names/cs1.devcoinswitch_crux.id`,
        qs: sinon.match.any
      }

      // initialise the nameservice
      let bs = new blockstackService.BlockstackService(nameservice_options);
      // restore the identity using identityClaim
      await bs.restoreIdentity(sampleCruxId, sampleIdentityClaim)
      // fetch registrationStatus
      let resolvedStatus = await bs.getRegistrationStatus(sampleIdentityClaim);
      expect(httpJSONRequestStub.callCount).to.equal(2)
      expect(httpJSONRequestStub.calledWith(bnsRequestOptions1)).is.true
      expect(httpJSONRequestStub.calledWith(bnsRequestOptions2)).is.true
      expect(resolvedStatus).to.eql(registeredStatus);
    })
    it(`given registrat pending identityClaim (carol3@devcoinswitch.crux), should return PENDING`, async () => {
      let pendingCruxId = "carol3@devcoinswitch.crux";
      let pendingIdentityClaim = { "secrets": { "identityKeyPair": { "address": "1FnntbZKRLB7rZFvng9PDgvMMEXMek1jrv", "privKey": "d4f1d65bbe0a89a91506828f4e62639b99558aeffda06b6f66961dccec5e301b01", "pubKey": "03d2b5b73bd06b624ccd24d05d0ffc259e7b9180d85b29f61e16404866fe344e60" }, "mnemonic": "minute furnace room favorite hunt auto scrap angry tribe wait foam drive" } }
      let bnsRequestOptions1 = {
        baseUrl: 'https://core.blockstack.org',
        json: true,
        method: "GET",
        url: `/v1/names/carol3.devcoinswitch_crux.id`,
        qs: sinon.match.any
      }
      let bnsRequestOptions2 = {
        baseUrl: 'https://bns.cruxpay.com',
        json: true,
        method: "GET",
        url: `/v1/names/carol3.devcoinswitch_crux.id`,
        qs: sinon.match.any
      }
      let registrarRequestOptions = {
        baseUrl: "https://registrar.coinswitch.co:3000",
        headers: {'x-domain-name': 'devcoinswitch_crux'},
        json: true,
        method: "GET",
        url: `/status/carol3`,
      }

      let bs = new blockstackService.BlockstackService(nameservice_options);
      await bs.restoreIdentity(pendingCruxId, pendingIdentityClaim)
      let resolvedStatus = await bs.getRegistrationStatus(sampleIdentityClaim);
      expect(httpJSONRequestStub.callCount).to.equal(5)
      expect(httpJSONRequestStub.calledWith(bnsRequestOptions1)).is.true
      expect(httpJSONRequestStub.calledWith(bnsRequestOptions2)).is.true
      expect(httpJSONRequestStub.calledWith(registrarRequestOptions)).is.true
      expect(resolvedStatus).to.eql(registrarPendingStatus);
    })
    it(`address for bns node and identityclaim mismatch(carol4@devcoinswitch.crux), should return PENDING`, async () => {
      let CruxId = "carol4@devcoinswitch.crux";
      let IdentityClaim1 = { "secrets": { "identityKeyPair": { "address": "1FnntbZKRLB7rZFvng9PDgvMMEXMek1jrv", "privKey": "d4f1d65bbe0a89a91506828f4e62639b99558aeffda06b6f66961dccec5e301b01", "pubKey": "03d2b5b73bd06b624ccd24d05d0ffc259e7b9180d85b29f61e16404866fe344e60" }, "mnemonic": "minute furnace room favorite hunt auto scrap angry tribe wait foam drive" } }
      let IdentityClaim2 = { "secrets": { "identityKeyPair": { "address": "1FnntbZKRLB7rZFvng9PDgvMMEXMek1jrv_something", "privKey": "d4f1d65bbe0a89a91506828f4e62639b99558aeffda06b6f66961dccec5e301b01", "pubKey": "03d2b5b73bd06b624ccd24d05d0ffc259e7b9180d85b29f61e16404866fe344e60" }, "mnemonic": "minute furnace room favorite hunt auto scrap angry tribe wait foam drive" } }
      let bnsRequestOptions1 = {
        baseUrl: 'https://core.blockstack.org',
        json: true,
        method: "GET",
        url: `/v1/names/carol4.devcoinswitch_crux.id`,
        qs: sinon.match.any
      }
      let bnsRequestOptions2 = {
        baseUrl: 'https://bns.cruxpay.com',
        json: true,
        method: "GET",
        url: `/v1/names/carol4.devcoinswitch_crux.id`,
        qs: sinon.match.any
      }
      let bs = new blockstackService.BlockstackService(nameservice_options);
      await bs.restoreIdentity(CruxId, IdentityClaim1)
      let resolvedStatus = await bs.getRegistrationStatus(IdentityClaim2);
      expect(httpJSONRequestStub.callCount).to.equal(2)
      expect(httpJSONRequestStub.calledWith(bnsRequestOptions1)).is.true
      expect(httpJSONRequestStub.calledWith(bnsRequestOptions2)).is.true
      expect(resolvedStatus).to.eql(rejectStatus);
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
      headers: { 'Content-Type': 'application/json', 'x-domain-name': 'devcoinswitch_crux' },
      body: {
        zonefile:
          '$ORIGIN bob\n$TTL 3600\n_https._tcp URI 10 1 https://hub.cruxpay.com',
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
      headers: { 'Content-Type': 'application/json', 'x-domain-name': 'devcoinswitch_crux' },
      body:
      {
        zonefile:
          '$ORIGIN cs1\n$TTL 3600\n_https._tcp URI 10 1 https://hub.cruxpay.com',
        name: 'cs1',
        owner_address: '1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ'
      },
      json: true,
      strictSSL: false
    }
    let registrarRequestOptions2 = {
      method: 'POST',
      baseUrl: 'https://registrar.coinswitch.co:3000',
      url: '/register',
      headers: { 'Content-Type': 'application/json', 'x-domain-name': 'devcoinswitch_crux' },
      body: {
        zonefile:
          '$ORIGIN mark\n$TTL 3600\n_https._tcp URI 10 1 https://hub.cruxpay.com',
        name: 'mark',
        owner_address: '1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ'
      },
      json: true,
      strictSSL: false
    }

    it('given valid identityClaim and a non-registered cruxId (bob@devcoinswitch.crux), should successfully register and return the fullCruxId', async () => {
      let registeredName = await blkstkService.registerName(sampleIdentityClaim, desiredName)
      expect(httpJSONRequestStub.calledOnce).is.true
      // expect(httpJSONRequestStub.calledWith(hubInfoRequestOptions)).is.true
      expect(httpJSONRequestStub.calledWith(registrarRequestOptions)).is.true
      expect(registeredName).is.equal(expectedRegisteredName)
    })
    it('given valid identityClaim and a registered cruxId, should throw "SubdomainRegistrationFailed"', async () => {
      let raisedError
      try {
        await blkstkService.registerName(sampleIdentityClaim, sampleSubdomain)
      } catch (error) {
        raisedError = error
      }
      expect(httpJSONRequestStub.calledOnce).is.true
      expect(httpJSONRequestStub.calledWith(redundantRegistrarRequestOptions)).is.true
      expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.SubdomainRegistrationFailed)
    })

    it('given identityClaim without keypair should throw "CouldNotFindKeyPairToRegisterName"', async() => {
      let raisedError
      try {
        await blkstkService.registerName(sampleIdentityClaimWithoutKeyPair, sampleSubdomain)
      } catch (error) {
        raisedError = error
      }
      expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.CouldNotFindKeyPairToRegisterName)
    })
    it('given valid identityClaim and a cruxId, if registration status is false then sould SubdomainRegistrationAcknowledgementFailed', async () => {
      let desiredName = 'mark'
      let raisedError
      try {
        await blkstkService.registerName({ secrets: { identityKeyPair: sampleIdentityClaim.secrets.identityKeyPair } }, desiredName) 
      } catch (error) {
        raisedError = error
      }
      expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.SubdomainRegistrationAcknowledgementFailed)
    })
  })

  describe('putAddressMapping tests', () => {
    it('given valid identityClaim and valid addressMap, should resolve the promise without errors', async () => {
      // mocked values
      connectToGaiaHubStub.resolves({ "url_prefix": "https://gaia.cruxpay.com/", "address": "1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ", "token": "v1:eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJnYWlhQ2hhbGxlbmdlIjoiW1wiZ2FpYWh1YlwiLFwiMFwiLFwic3RvcmFnZTIuYmxvY2tzdGFjay5vcmdcIixcImJsb2Nrc3RhY2tfc3RvcmFnZV9wbGVhc2Vfc2lnblwiXSIsImh1YlVybCI6Imh0dHBzOi8vaHViLmJsb2Nrc3RhY2sub3JnIiwiaXNzIjoiMDJiYzljM2Y4ZTkyNGI3ZGU5MjEyY2ViZDAxMjlmMWJlMmU2YzNmMjkwNGU5MTFiMzA2OThiZGU3N2JlNDg3OGI4Iiwic2FsdCI6ImE0ODk1ZWE1ZjdjZjI2N2VhNDEwMjg2ZjRjNzk4MTY3In0.QFuEEVijDYMKHjERaPA_YXwnwWoBq8iVg4pzEusP0S_u5jSmmxqeJcumyMK8cqT4NTmOYgnMUC4u4-9OAUWOIQ", "server": "https://hub.cruxpay.com" })
      uploadToGaiaHubStub.resolves("https://gaia.cruxpay.com/1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ/devcoinswitch_cruxpay.json")

      // initialising the nameservice
      let bs = new blockstackService.BlockstackService(nameservice_options)
      // restoring identity
      await bs.restoreIdentity(sampleCruxId, sampleIdentityClaim)
      let acknowledgement = await bs.putAddressMapping(sampleIdentityClaim, sampleAddressMap)

      expect(connectToGaiaHubStub.calledOnce).is.true
      expect(uploadToGaiaHubStub.calledOnce).is.true
      expect(acknowledgement).is.undefined
    })
    it('given valid identityClaim and invalid addressMap, should throw "AddressMappingDecodingFailure"', async () => {
      // initialising the nameservice
      let bs = new blockstackService.BlockstackService(nameservice_options)
      // restoring identity
      await bs.restoreIdentity(sampleCruxId, sampleIdentityClaim)

      let raisedError
      try {
        let acknowledgement = await bs.putAddressMapping(sampleIdentityClaim, { invalidKey: "invalidAddress" })
      } catch (error) {
        raisedError = error
      }
      expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.AddressMappingDecodingFailure)
    })
    it('given invalid identityClaim (only mnemonic) and valid addressMap, should throw "CouldNotFindIdentityKeyPairToPutAddressMapping"', async () => {
      // initialising the nameservice
      let bs = new blockstackService.BlockstackService(nameservice_options)
      // restoring identity
      await bs.restoreIdentity(sampleCruxId, sampleIdentityClaim)

      let raisedError
      try {
        let acknowledgement = await bs.putAddressMapping({secrets: {mnemonic: sampleIdentityClaim.secrets.mnemonic}}, sampleAddressMap)
      } catch (error) {
        raisedError = error
      }
      expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.CouldNotFindIdentityKeyPairToPutAddressMapping)
    })
    it('if uploadContentToGaiaHub breaks, should raise "GaiaCruxPayUploadFailed"', async () => {
      uploadToGaiaHubStub.onCall(0).throws('unhandled in mocks')
      let bs = new blockstackService.BlockstackService(nameservice_options)
      await bs.restoreIdentity(sampleCruxId, sampleIdentityClaim)
      let raisedError
      try {
        await bs.putAddressMapping(sampleIdentityClaim, sampleAddressMap)
      } catch (error) {
        raisedError = error
      }
      expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.GaiaCruxPayUploadFailed)
      expect(connectToGaiaHubStub.calledOnce).is.true
      expect(uploadToGaiaHubStub.calledOnce).is.true
    })
  })

  describe('getAddressMapping tests', () => {
    let bnsRequestOptions1 = {
      method: 'GET',
      baseUrl: 'https://core.blockstack.org',
      url: '/v1/names/cs1.devcoinswitch_crux.id',
      json: true,
      qs: sinon.match.any
    }
    let bnsRequestOptions2 = {
      method: 'GET',
      baseUrl: 'https://bns.cruxpay.com',
      url: '/v1/names/cs1.devcoinswitch_crux.id',
      json: true,
      qs: sinon.match.any
    }
    let gaiaRequestOptions = { method: "GET", url: "https://gaia.cruxpay.com/1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ/devcoinswitch_cruxpay.json", json: true }

    it('given registered cruxId (sanchay@devcoinswitch.crux), which does not have pulic addressMap should throw "GaiaCruxPayGetFailed"', async () => {
      let raisedError
      try {
        let resolvedAddressMap: IAddressMapping = await blkstkService.getAddressMapping("sanchay@devcoinswitch.crux")
      } catch (error) {
        raisedError = error
      }
      expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.GaiaCruxPayGetFailed)
    })
    
    it('given registered cruxId (cs1@devcoinswitch.crux), which have public addressMap should resolve the addressMap', async () => {
      let resolvedAddressMap: IAddressMapping = await blkstkService.getAddressMapping(sampleCruxId)
      expect(httpJSONRequestStub.calledThrice).is.true
      expect(httpJSONRequestStub.calledWith(bnsRequestOptions1)).is.true
      expect(httpJSONRequestStub.calledWith(bnsRequestOptions2)).is.true
      expect(httpJSONRequestStub.calledWith(gaiaRequestOptions)).is.true
      expect(resolvedAddressMap).is.eql(sampleAddressMap)
    })
    it('given unregistered cruxId, should throw "UserDoesNotExist"', async () => {
      let raisedError
      try {
        let resolvedAddressMap: IAddressMapping = await blkstkService.getAddressMapping("example@devcoinswitch.crux")
      } catch (error) {
        raisedError = error
      }
      expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.UserDoesNotExist)
    })
    it('given registered cruxId, which has not made addresses public, should throw "GaiaEmptyResponse"', async() => {
      let gaiaRequestOptions = { method: "GET", url: "https://gaia.cruxpay.com/1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ/devcoinswitch_cruxpay.json", json: true }
      let response = "<Error><Code>BlobNotFound</Code><Message>The specified blob does not exist.RequestId:299c4c0b-701e-0066-67df-7d085b000000Time:2019-10-08T13:54:51.8653868Z</Message></Error>"
      httpJSONRequestStub.withArgs(gaiaRequestOptions).returns(response)
      let raisedError
      try {
        await blkstkService.getAddressMapping("cs1@devcoinswitch.crux")
      } catch (error) {
          console.log(error.stack);
          raisedError = error
      }
      expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.GaiaEmptyResponse)
    })
  })
  describe("getUploadPackageErrorCodeForFilename tests", () => {
    it("given filename, returns upload package error code", async() => {
      let fileNameCruxPay = UPLOADABLE_JSON_FILES.CRUXPAY
      let fileNameClientConfig = UPLOADABLE_JSON_FILES.CLIENT_CONFIG
      
      let cruxPayStatus = blockstackService.BlockstackService.getUploadPackageErrorCodeForFilename(fileNameCruxPay)
      expect(cruxPayStatus).to.be.equal(errors.PackageErrorCode.GaiaCruxPayUploadFailed)

      let clientConfigPayStatus = blockstackService.BlockstackService.getUploadPackageErrorCodeForFilename(fileNameClientConfig)
      expect(clientConfigPayStatus).to.be.equal(errors.PackageErrorCode.GaiaClientConfigUploadFailed)
    })
  })

  describe("getCruxIDByAddress tests", () => {
    it("126LEzWTg6twppHtJodwF8am8PwPdgbmwV should resolve to ankit@cruxdev.crux using cruxdev", async () => {
      const cruxID = await getCruxIDByAddress("cruxdev", "126LEzWTg6twppHtJodwF8am8PwPdgbmwV", config.BLOCKSTACK.BNS_NODES, config.BLOCKSTACK.SUBDOMAIN_REGISTRAR)
      let bnsRequestOptions1 = {
        baseUrl: "https://core.blockstack.org", 
        json: true, 
        method: "GET", 
        url: "/v1/addresses/bitcoin/126LEzWTg6twppHtJodwF8am8PwPdgbmwV"
      }
      let bnsRequestOptions2 = {
        baseUrl: "https://bns.cruxpay.com", 
        json: true, 
        method: "GET", 
        url: "/v1/addresses/bitcoin/126LEzWTg6twppHtJodwF8am8PwPdgbmwV"
      }
      expect(httpJSONRequestStub.calledTwice).is.true
      expect(httpJSONRequestStub.calledWith(bnsRequestOptions1)).is.true
      expect(httpJSONRequestStub.calledWith(bnsRequestOptions2)).is.true
      expect(cruxID).to.be.equal("ankit@cruxdev.crux")
    })

    it("1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ should resolve to empty array using cruxdev", async () => {
      const cruxID = await getCruxIDByAddress("cruxdev", "1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ", config.BLOCKSTACK.BNS_NODES, config.BLOCKSTACK.SUBDOMAIN_REGISTRAR)
      let bnsRequestOptions1 = {
        baseUrl: "https://core.blockstack.org", 
        json: true, 
        method: "GET", 
        url: "/v1/addresses/bitcoin/1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ"
      }
      let bnsRequestOptions2 = {
        baseUrl: "https://bns.cruxpay.com", 
        json: true, 
        method: "GET", 
        url: "/v1/addresses/bitcoin/1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ"
      }
      let registrarQueryOptions = {
        "baseUrl":"https://registrar.coinswitch.co:3000",
        "headers":{"x-domain-name":"cruxdev_crux"},
        "json":true,
        "method":"GET",
        "url":"/subdomain/1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ"
      }
      expect(httpJSONRequestStub.calledThrice).is.true
      expect(httpJSONRequestStub.calledWith(bnsRequestOptions1)).is.true
      expect(httpJSONRequestStub.calledWith(bnsRequestOptions2)).is.true
      expect(httpJSONRequestStub.calledWith(registrarQueryOptions)).is.true
      expect(cruxID).to.be.null
    })
    it("126LEzWTg6twppHtJodwF8am8PwPdgbmwV should resolve to empty array using scatter_dev", async () => {
      const cruxID = await getCruxIDByAddress("scatter_dev", "126LEzWTg6twppHtJodwF8am8PwPdgbmwV", config.BLOCKSTACK.BNS_NODES, config.BLOCKSTACK.SUBDOMAIN_REGISTRAR)
      let bnsRequestOptions1 = {
        baseUrl: "https://core.blockstack.org", 
        json: true, 
        method: "GET", 
        url: "/v1/addresses/bitcoin/126LEzWTg6twppHtJodwF8am8PwPdgbmwV"
      }
      let bnsRequestOptions2 = {
        baseUrl: "https://bns.cruxpay.com", 
        json: true, 
        method: "GET", 
        url: "/v1/addresses/bitcoin/126LEzWTg6twppHtJodwF8am8PwPdgbmwV"
      }
      let registrarQueryOptions = {
        "baseUrl":"https://registrar.coinswitch.co:3000",
        "headers":{"x-domain-name":"scatter_dev_crux"},
        "json":true,
        "method":"GET",
        "url":"/subdomain/126LEzWTg6twppHtJodwF8am8PwPdgbmwV"
      }
      expect(httpJSONRequestStub.calledThrice).is.true
      expect(httpJSONRequestStub.calledWith(bnsRequestOptions1)).is.true
      expect(httpJSONRequestStub.calledWith(bnsRequestOptions2)).is.true
      expect(httpJSONRequestStub.calledWith(registrarQueryOptions)).is.true
      expect(cruxID).to.be.null
    })
  })

  describe("mnemonic storage tests", () => {
    it("store and retrieve mnemonic from storage", async () => {
      const storage = new LocalStorage();
      const encryptionKey = "fookey";
      // @ts-ignore
      await blkstkService._storeMnemonic(sampleIdentityClaim.secrets.mnemonic, storage, encryptionKey)
      // @ts-ignore
      expect(localStorage.getItem(blockstackService.MNEMONIC_STORAGE_KEY)).is.not.undefined;
      // @ts-ignore
      const mnemonic = await blkstkService._retrieveMnemonic(storage, encryptionKey);
      expect(mnemonic).to.be.equal(sampleIdentityClaim.secrets.mnemonic);

    })
  })

})
