import 'mocha';
import { expect } from 'chai';

import sinon from 'sinon';

import * as utils from "../packages/utils";
import { ConfigurationService } from '../packages/configuration-service';
import requestFixtures from './requestMocks/config-reqmocks';
import { BlockstackService } from '../packages/name-service/blockstack-service';
import * as gaiaUtils from '../packages/gaia-service/utils';
import { errors, cacheStorage } from '..';
import { LocalStorage } from '../packages/storage';
var assert = require('chai').assert

describe("Configuration Tests", () => {
    beforeEach(() => {
      // @ts-ignore
      cacheStorage = new LocalStorage();
    })

    afterEach(() => {
      // @ts-ignore
      cacheStorage = undefined;
    })

    describe("after init tests", () => {
      
        let httpJSONRequestStub: sinon.SinonStub
        let nsConfigService = new ConfigurationService('cruxdev');

        before(() => {
            httpJSONRequestStub = sinon.stub(utils, 'httpJSONRequest').throws('unhandled in mocks')

            requestFixtures.forEach(requestObj => {
              httpJSONRequestStub.withArgs(requestObj.request).returns(requestObj.response)
            });
          });
      
          after(() => {
            httpJSONRequestStub.restore()
          });

          describe("Resolved Asset List Tests", () => {
            it("invalid name asset list", async () => {
              let nsConfigServiceTemp = new ConfigurationService('cruxdev');
              let mockedClientConfig = {
                nameserviceConfiguration: {
                  subdomainRegistrar: "mocked_subdomain_registrar"
                }
              }
              let getConfigStub = sinon.stub(gaiaUtils, 'getContentFromGaiaHub').resolves(mockedClientConfig)
              let raisedError
              try{
                await nsConfigServiceTemp.init()
              }catch(e){
                raisedError = e
              }
              expect(raisedError.errorCode).to.equal(errors.PackageErrorCode.CouldNotFindAssetListInClientConfig);
              getConfigStub.restore()
            })
          })


          describe("nameservice client creation from config", async () => {
            it("default nameservice client for empty override settings", async () => {
              await nsConfigService.init()
              let nsClient = new BlockstackService(await nsConfigService.getBlockstackServiceConfig());
              assert.instanceOf(nsClient, BlockstackService)
            })

            it("custom nameservice client by from client-config override", async () => {
              let mockedClientConfig = {
                nameserviceConfiguration: {
                  subdomainRegistrar: "mocked_subdomain_registrar"
                },
                assetList: [{
                  "assetId": "8dd939ef-b9d2-46f0-8796-4bd8dbaeef1b",
                  "name": "Litecoin",
                  "decimals": 8,
                  "assetType": null,
                  "symbol": "ltc",
                  "assetIdentifierName": null,
                  "assetIdentifierValue": null,
                  "parentAssetId": null,
                }]
              }
              let getConfigStub = sinon.stub(gaiaUtils, 'getContentFromGaiaHub').resolves(mockedClientConfig)
              await nsConfigService.init()
              let nsClient = new BlockstackService(await nsConfigService.getBlockstackServiceConfig())
              assert.instanceOf(nsClient, BlockstackService)
              expect(nsClient._subdomainRegistrar).to.equal('mocked_subdomain_registrar')
              getConfigStub.restore()
            })
            it("custom nameservice client from user zonefile gaiaHub override", async () => {
              let mockedNsConfigService = new ConfigurationService('cruxdev', 'umang@cruxdev.crux');
              await mockedNsConfigService.init()
              let nsClient = new BlockstackService(await mockedNsConfigService.getBlockstackServiceConfig())
              assert.instanceOf(nsClient, BlockstackService)
              expect(nsClient._gaiaService.gaiaWriteUrl).to.equal('https://hub.cruxpay.com')
            })
          })

          describe("configurator client creation", () => {
            it("invalid client name", async () => {
              let nsConfigService = new ConfigurationService('mocked_domain');
              let raiseError = false
              try{
                await nsConfigService.init()
              }catch(e){
                raiseError = true
                expect(e.errorCode).to.equal(1002)
              }
              finally{
                expect(raiseError).to.be.true
              }
            })
          })
    });
});
