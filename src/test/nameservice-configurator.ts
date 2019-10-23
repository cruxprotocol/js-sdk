import 'mocha';
import { expect } from 'chai';

import sinon from 'sinon';

import * as utils from "../packages/utils";
import { BlockstackConfigurationService } from '../packages/configuration-service';
import requestFixtures from './requestMocks/config-reqmocks';
import { BlockstackService } from '../packages/name-service/blockstack-service';
import { errors } from '..';
var assert = require('chai').assert

describe("Configuration Tests", () => {
    describe("after init tests", () => {
      
        let httpJSONRequestStub: sinon.SinonStub
        let nsConfigService = new BlockstackConfigurationService('cruxdev');
        let nsService = nsConfigService.blockstackNameservice

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
            it("Resolved Asset List Translates To List Object", async () => {
              await nsConfigService.init()
              let resolvedClientAssetList = await nsConfigService.getResolvedClientAssetMapping()
              expect(resolvedClientAssetList).to.eql(
                {"ltc": 
                  {
                    "assetId": "8dd939ef-b9d2-46f0-8796-4bd8dbaeef1b",
                    "name": "Litecoin",
                    "decimals": 8,
                    "assetType": null,
                    "symbol": "ltc",
                    "assetIdentifierName": null,
                    "assetIdentifierValue": null,
                    "parentAssetId": null,
                  }
                })
            })

            it("invalid name asset list", async () => {
              let nsConfigServiceTemp = new BlockstackConfigurationService('cruxdev');
              let mockedClientConfig = {
                nameserviceConfiguration: {
                  subdomainRegistrar: "mocked_subdomain_registrar"
                }
              }
              let getConfigStub = sinon.stub(nsConfigServiceTemp, '_getClientConfig').resolves(mockedClientConfig)
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
              let nsClient = await nsConfigService.getBlockstackServiceForConfig()
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
              let getConfigStub = sinon.stub(nsConfigService, '_getClientConfig').resolves(mockedClientConfig)
              await nsConfigService.init()
              let nsClient = await nsConfigService.getBlockstackServiceForConfig()
              assert.instanceOf(nsClient, BlockstackService)
              expect(nsClient._subdomainRegistrar).to.equal('mocked_subdomain_registrar')
              getConfigStub.restore()
            })
            it("custom nameservice client from user zonefile gaiaHub override", async () => {
              let mockedNsConfigService = new BlockstackConfigurationService('cruxdev', 'umang@cruxdev.crux');
              await mockedNsConfigService.init()
              let nsClient = await mockedNsConfigService.getBlockstackServiceForConfig()
              assert.instanceOf(nsClient, BlockstackService)
              expect(nsClient._gaiaService.gaiaWriteUrl).to.equal('https://hub.cruxpay.com')
            })
          })

          describe("configurator client creation", () => {
            it("invalid client name", async () => {
              let nsConfigService = new BlockstackConfigurationService('mocked_domain');
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
