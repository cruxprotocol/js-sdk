import 'mocha';
import { expect } from 'chai';

import sinon from 'sinon';

import * as utils from "../packages/utils";
import { BlockstackConfigurationService } from '../packages/configuration-service';
import requestFixtures from './requestMocks/config-reqmocks';
import { BlockstackService } from '../packages/nameservice';
var assert = require('chai').assert

describe("Configuration Tests", () => {
    describe("BlockstackConfigurationService Tests", () => {
      
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

          describe("Global Asset List Tests", () => {
            it("Owner List Translates To List Object", async () => {
              await nsConfigService.init()
              let globalAssetList = await nsConfigService.getGlobalAssetList()
              expect(globalAssetList).to.eql([{"asset_id":"8dd939ef-b9d2-46f0-8796-4bd8dbaeef1b","name":"Litecoin","symbol":"ltc","image_sm_url":"https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/litecoin.png"}])
            })

            it("Trying To Get Global Asset List From Incorrect Domain", async () => {
              let stubbedDomainName = sinon.stub(nsConfigService, 'settingsDomain').value('mocked_domain')
              try{
                await nsConfigService.getGlobalAssetList()
              }catch(e){
                expect(e.toString()).to.equal('Error: assetList not present in clientConfig')
              }finally{
                stubbedDomainName.restore()
              }
            })
          })


          describe("NameService Client For Config", async () => {
            it("For Empty Config Should Return Default NS Client", async () => {
              let getConfigStub = sinon.stub(nsConfigService, 'getClientConfig').resolves({})
              await nsConfigService.init()

              let nsClient = await nsConfigService.getBlockstackServiceForConfig('scatter_dev')
              assert.instanceOf(nsClient, BlockstackService)
              expect(nsClient.type).to.equal('blockstack')
              getConfigStub.restore()
            })
          })


          describe("Get Client Asset Mapping", () => {
            it("gets config from required source", async () => {
              let configPromise = new Promise<any>(async(resolve, reject) => {
                resolve({assetMapping: {
                    EOS: "9dbdc727-de68-4f2a-8956-04a38ed71ca6",
                    ETH: "508b8f73-4b06-453e-8151-78cb8cfc3bc9",
                  }, 
                  nameserviceConfiguration: {
                    domain: "scatter_dev",
                    subdomainRegistrar: "https://registrar.coinswitch.co:4000"
                  }
                })
              })

              let getConfigStub = sinon.stub(nsConfigService, 'getClientConfig').returns(configPromise)
              await nsConfigService.init()

              let mockedClientAsssetMapping = await nsConfigService.getClientAssetMapping('scatter_dev')
              expect(mockedClientAsssetMapping).to.deep.include({EOS: "9dbdc727-de68-4f2a-8956-04a38ed71ca6"})
              expect(mockedClientAsssetMapping).to.deep.include({ETH: "508b8f73-4b06-453e-8151-78cb8cfc3bc9"})
              getConfigStub.restore()
            })
          })
    });
});
