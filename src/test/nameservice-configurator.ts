import 'mocha';
import { expect } from 'chai';

import sinon from 'sinon';

import * as utils from "../packages/utils";
import { BlockstackConfigurationService } from '../packages/configuration-service';
import requestFixtures from './requestMocks/config-reqmocks';
import { BlockstackService } from '../packages/nameservice';
import { async } from 'q';
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

          describe("global asset list tests", () => {

            // name here refers to blockstack domain (cruxpay.id)

            it("positive case, valid name asset list", async () => {
              let gotData = sinon.spy(nsService, "getContentFromGaiaHub")
              let globalAssetList = await nsConfigService.getGlobalAssetList()
              expect(gotData.callCount).to.equal(1)
              expect(globalAssetList).to.eql([{"asset_id":"8dd939ef-b9d2-46f0-8796-4bd8dbaeef1b","name":"Litecoin","symbol":"ltc","image_sm_url":"https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/litecoin.png"}])
              gotData.restore()
            })

            it("invalid name asset list", async () => {
              let stubbedDomainName = sinon.stub(nsConfigService, 'settingsDomain').value('mocked_domain')
              try{
                await nsConfigService.getGlobalAssetList()
              }catch(e){
                expect(e.error_code).to.equal(1037)
              }finally{
                stubbedDomainName.restore()
              }
            })
          })


          describe("nameservice client creation from config", async () => {
            it("default nameservice client for empty override settings", async () => {
              let getConfigStub = sinon.stub(nsConfigService, 'getClientConfig').resolves({})
              await nsConfigService.init()
              let nsClient = await nsConfigService.getBlockstackServiceForConfig('scatter_dev')
              assert.instanceOf(nsClient, BlockstackService)
              getConfigStub.restore()
            })

            it("custom nameservice client by from client-config override", async () => {
              let mockedClientConfig = {nameserviceConfiguration: {subdomainRegistrar: "mocked_subdomain_registrar"}}
              let getConfigStub = sinon.stub(nsConfigService, 'getClientConfig').resolves(mockedClientConfig)
              await nsConfigService.init()
              let nsClient = await nsConfigService.getBlockstackServiceForConfig('scatter_dev')
              assert.instanceOf(nsClient, BlockstackService)
              expect(nsClient._subdomainRegistrar).to.equal('mocked_subdomain_registrar')
              getConfigStub.restore()
            })
          })


          describe("client asset mapping tests", () => {
            it("valid subdomain get client asset mapping", async () => {
              let configPromise = new Promise<any>(async(resolve, reject) => {resolve({assetMapping: {EOS: "9dbdc727-de68-4f2a-8956-04a38ed71ca6",}, })})
              let getConfigStub = sinon.stub(nsConfigService, 'getClientConfig').returns(configPromise)
              await nsConfigService.init()
              let mockedClientAsssetMapping = await nsConfigService.getClientAssetMapping('scatter_dev')
              expect(mockedClientAsssetMapping).to.deep.include({EOS: "9dbdc727-de68-4f2a-8956-04a38ed71ca6"})
              getConfigStub.restore()
            })
          })

          describe("configurator client creation", () => {
            it("invalid client name", async () => {
              let nsConfigService = new BlockstackConfigurationService('mocked_subdomain');
              let stubbedDomainName = sinon.stub(nsConfigService, 'settingsDomain').value('mocked_domain')
              let raiseError = false
              try{
                await nsConfigService.init()
              }catch(e){
                raiseError = true
                expect(e.error_code).to.equal(1037)
              }
              finally{
                expect(raiseError).to.be.true
                stubbedDomainName.restore()
              }
            })
          })

          describe('virtual address tests', () => {
            it("get virtual address for client name", () => {
              let vAdd = nsConfigService.getVirtualAddressFromClientName('scatter')
              expect(vAdd).to.be.string
            })
          })
    });
});