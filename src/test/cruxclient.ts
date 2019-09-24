
import WebCrypto from "node-webcrypto-ossl";
import 'mocha';
import {CruxClient} from "../index";
import sinon from "sinon";
import * as utils from "../packages/utils";
import requestFixtures from './requestMocks/cruxclient-reqmocks';
import { expect } from 'chai';
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

		describe('updatePassword tests', () => {

			it('after encryption is mnemonic and identityKeyPair are same', async () => {
				localStorage.setItem('payIDClaim', JSON.stringify({"virtualAddress":"yadunandan.cruxdev.crux","identitySecrets":"{\"iv\":\"XJmOCWeHzU4HfsYI\",\"encBuffer\":\"ss20WCh7PW64wWswkRUu/dxMkPro2KmD1rCGLKdtew82cPuJwZTqcdrfz9GBJOYqsHrzE4lOoUmODHeWor3ebC6vHCU8tQdg17Rlpdj3hx2FU0XTY1PsmJft4wZOvb9uThk6estvQgnj5/7quw9Be6oGt6gyCtOYsxtfSQysH0kfgRauCEOx4tTjSXO2GAufeEK4hubCC7bJ6iQCr9uAeMWRSxFknK8I+M62RnE8iINVp2yQ+5I3M7Z8oFRSzwi0nJAVps/rTMfZOw2mXYtgEgY59aSXItr+hHSGGF0pWHqlRNzcCbV11MdBCIrEHWhOnU/hK5PWSxJMRytIwEaYspXqWEu+KaftkKIxr/CU/rnCd8w/ML0lS7hMXljMG95BN66M8k5vXHkAmdmMRZdQN4Y4nD5vhxY0q69+37fH0LmsMG0tKdm3d4H8PVpu\"}"}))
				let cruxClient = new CruxClient({
					getEncryptionKey: () => "fookey",
					walletClientName: 'scatter_dev'
				});
	
				await cruxClient.init()

				let oldEncryptionKey = "fookey"
				let newEncryptionKey = "fookey1"
				await cruxClient.init()
				await (cruxClient.getPayIDClaim()).decrypt(oldEncryptionKey)
				let decryptedBeforeValue: PayIDClaim = cruxClient.getPayIDClaim()
				await (cruxClient.getPayIDClaim()).encrypt(oldEncryptionKey)

				// function being tested
				await cruxClient.updatePassword(oldEncryptionKey, newEncryptionKey)

				await (cruxClient.getPayIDClaim()).decrypt(newEncryptionKey)
				let decryptedAfterValue: PayIDClaim = cruxClient.getPayIDClaim()

				expect(decryptedBeforeValue.identitySecrets['mnemonic']).to.equal(decryptedAfterValue.identitySecrets['mnemonic'])
				expect(decryptedBeforeValue.identitySecrets['identityKeyPair']).to.equal(decryptedAfterValue.identitySecrets['identityKeyPair'])
				expect(decryptedBeforeValue.virtualAddress).to.equal(decryptedAfterValue.virtualAddress)
				localStorage.clear();
			})

		})

		describe("crux id tests", () => {
			it("getCruxIDState should return undefine cruxID when no payIDClaim in local storage",async () => {
				localStorage.clear();
				let cruxClient = new CruxClient({
					getEncryptionKey: () => "fookey",
					walletClientName: 'scatter_dev'
				});
				await cruxClient.init()
				let cruxIdState = await cruxClient.getCruxIDState()
				expect(cruxIdState.status.cruxID).to.equal(undefined)
			})

			it("getIDStatus should return `NONE` when no payIDClaim in local storage", async () => {
				localStorage.clear();
				let cruxClient = new CruxClient({
					getEncryptionKey: () => "fookey",
					walletClientName: 'scatter_dev'
				});
				await cruxClient.init()
				let cruxIDStatus = await cruxClient.getIDStatus()
				expect(cruxIDStatus.status).to.equal('NONE')
			})

			it("should not be allowed to store payIDClaim of another namespace except crux", async () => {
				localStorage.setItem('payIDClaim', JSON.stringify({"virtualAddress":"yadunandan.devcoinswitch.id","identitySecrets":"{\"iv\":\"XJmOCWeHzU4HfsYI\",\"encBuffer\":\"ss20WCh7PW64wWswkRUu/dxMkPro2KmD1rCGLKdtew82cPuJwZTqcdrfz9GBJOYqsHrzE4lOoUmODHeWor3ebC6vHCU8tQdg17Rlpdj3hx2FU0XTY1PsmJft4wZOvb9uThk6estvQgnj5/7quw9Be6oGt6gyCtOYsxtfSQysH0kfgRauCEOx4tTjSXO2GAufeEK4hubCC7bJ6iQCr9uAeMWRSxFknK8I+M62RnE8iINVp2yQ+5I3M7Z8oFRSzwi0nJAVps/rTMfZOw2mXYtgEgY59aSXItr+hHSGGF0pWHqlRNzcCbV11MdBCIrEHWhOnU/hK5PWSxJMRytIwEaYspXqWEu+KaftkKIxr/CU/rnCd8w/ML0lS7hMXljMG95BN66M8k5vXHkAmdmMRZdQN4Y4nD5vhxY0q69+37fH0LmsMG0tKdm3d4H8PVpu\"}"}))
				let cruxClient = new CruxClient({
					getEncryptionKey: () => "fookey",
					walletClientName: 'scatter_dev'
				});
				let raiseException = false
				try{
					await cruxClient.init()
				}
				catch(e){
					raiseException = true
					sinon.assert.match(e.toString(), sinon.match('Error: Only .crux namespace is supported in CruxID'))
				}
				expect(raiseException).to.equal(true)
			})

			it("register a new crux id syedhassanashraf.crux.id", async () => {
				localStorage.clear()
				localStorage.setItem('payIDClaim', JSON.stringify({"virtualAddress":"syedhassanashraf@cruxdev.crux","identitySecrets":"{\"iv\":\"XJmOCWeHzU4HfsYI\",\"encBuffer\":\"ss20WCh7PW64wWswkRUu/dxMkPro2KmD1rCGLKdtew82cPuJwZTqcdrfz9GBJOYqsHrzE4lOoUmODHeWor3ebC6vHCU8tQdg17Rlpdj3hx2FU0XTY1PsmJft4wZOvb9uThk6estvQgnj5/7quw9Be6oGt6gyCtOYsxtfSQysH0kfgRauCEOx4tTjSXO2GAufeEK4hubCC7bJ6iQCr9uAeMWRSxFknK8I+M62RnE8iINVp2yQ+5I3M7Z8oFRSzwi0nJAVps/rTMfZOw2mXYtgEgY59aSXItr+hHSGGF0pWHqlRNzcCbV11MdBCIrEHWhOnU/hK5PWSxJMRytIwEaYspXqWEu+KaftkKIxr/CU/rnCd8w/ML0lS7hMXljMG95BN66M8k5vXHkAmdmMRZdQN4Y4nD5vhxY0q69+37fH0LmsMG0tKdm3d4H8PVpu\"}"}))
				let cruxClient = new CruxClient({
					getEncryptionKey: () => "fookey",
					walletClientName: 'scatter_dev'
				});		
				await cruxClient.init()
				let alwaysTruePromise = new Promise<any>(async(resolve, reject) => {resolve(true)})
				let updateProfileStub = sinon.stub(cruxClient._nameservice, '_uploadProfileInfo').returns(alwaysTruePromise)

				let registerSubdomainPromise = new Promise<any>(async(resolve, reject) => {resolve('syedhassanashraf.crux.id')})
				let registerSubdomainStub = sinon.stub(cruxClient._nameservice, '_registerSubdomain').returns(registerSubdomainPromise)
				let raisedException = false
				try{
					await cruxClient.registerCruxID('syedhassanashraf')
				}catch(e){
					raisedException = true
				}
				// registering subdomain on blockchain and uploading profile information
				expect(registerSubdomainStub.callCount).to.equal(1)
				expect(updateProfileStub.callCount).to.equal(1)

				expect(raisedException).to.equal(false)
				updateProfileStub.restore()
				registerSubdomainStub.restore()
			})

		})

		describe("currency address resolution", () => {
			it("resolving currency address for a valid asset id", async () => {
				localStorage.clear();
				localStorage.setItem('payIDClaim', JSON.stringify({"virtualAddress":"syedhassanashraf@cruxdev.crux","identitySecrets":"{\"iv\":\"XJmOCWeHzU4HfsYI\",\"encBuffer\":\"ss20WCh7PW64wWswkRUu/dxMkPro2KmD1rCGLKdtew82cPuJwZTqcdrfz9GBJOYqsHrzE4lOoUmODHeWor3ebC6vHCU8tQdg17Rlpdj3hx2FU0XTY1PsmJft4wZOvb9uThk6estvQgnj5/7quw9Be6oGt6gyCtOYsxtfSQysH0kfgRauCEOx4tTjSXO2GAufeEK4hubCC7bJ6iQCr9uAeMWRSxFknK8I+M62RnE8iINVp2yQ+5I3M7Z8oFRSzwi0nJAVps/rTMfZOw2mXYtgEgY59aSXItr+hHSGGF0pWHqlRNzcCbV11MdBCIrEHWhOnU/hK5PWSxJMRytIwEaYspXqWEu+KaftkKIxr/CU/rnCd8w/ML0lS7hMXljMG95BN66M8k5vXHkAmdmMRZdQN4Y4nD5vhxY0q69+37fH0LmsMG0tKdm3d4H8PVpu\"}"}))
				let cruxClient = new CruxClient({
					getEncryptionKey: () => "fookey",
					walletClientName: 'scatter_dev'
				});
				await cruxClient.init()
				let mockedSampleAddress = {"1d6e1a99-1e77-41e1-9ebb-0e216faa166a": {addressHash: "19m51F8YkjzK625csaNtKnM9pgByeMJRU3"}}

				let mockedClientMapping = { BTC: '1d6e1a99-1e77-41e1-9ebb-0e216faa166a' }

				let clientMappingStub = sinon.stub(cruxClient, '_clientMapping').value(mockedClientMapping)
				let addressMappingStub = sinon.stub(cruxClient._nameservice, 'getAddressMapping').returns(mockedSampleAddress)

				let resolvedAddress = await cruxClient.resolveCurrencyAddressForCruxID("syedhassanashraf@cruxdev.crux", "BTC")
				expect(resolvedAddress.addressHash).to.equal('19m51F8YkjzK625csaNtKnM9pgByeMJRU3')
				clientMappingStub.restore()
				addressMappingStub.restore()
			})


			it("resolving currency address for an invalid asset id", async () => {
				localStorage.clear();
				localStorage.setItem('payIDClaim', JSON.stringify({"virtualAddress":"syedhassanashraf@cruxdev.crux","identitySecrets":"{\"iv\":\"XJmOCWeHzU4HfsYI\",\"encBuffer\":\"ss20WCh7PW64wWswkRUu/dxMkPro2KmD1rCGLKdtew82cPuJwZTqcdrfz9GBJOYqsHrzE4lOoUmODHeWor3ebC6vHCU8tQdg17Rlpdj3hx2FU0XTY1PsmJft4wZOvb9uThk6estvQgnj5/7quw9Be6oGt6gyCtOYsxtfSQysH0kfgRauCEOx4tTjSXO2GAufeEK4hubCC7bJ6iQCr9uAeMWRSxFknK8I+M62RnE8iINVp2yQ+5I3M7Z8oFRSzwi0nJAVps/rTMfZOw2mXYtgEgY59aSXItr+hHSGGF0pWHqlRNzcCbV11MdBCIrEHWhOnU/hK5PWSxJMRytIwEaYspXqWEu+KaftkKIxr/CU/rnCd8w/ML0lS7hMXljMG95BN66M8k5vXHkAmdmMRZdQN4Y4nD5vhxY0q69+37fH0LmsMG0tKdm3d4H8PVpu\"}"}))
				let cruxClient = new CruxClient({
					getEncryptionKey: () => "fookey",
					walletClientName: 'scatter_dev'
				});
				await cruxClient.init()
				let mockedSampleAddress = {"1d6e1a99-1e77-41e1-9ebb-0e216faa166a": {addressHash: "19m51F8YkjzK625csaNtKnM9pgByeMJRU3"}}

				let mockedClientMapping = { BTC: '1d6e1a99-1e77-41e1-9ebb-0e216faa166a' }

				let clientMappingStub = sinon.stub(cruxClient, '_clientMapping').value(mockedClientMapping)
				let addressMappingStub = sinon.stub(cruxClient._nameservice, 'getAddressMapping').returns(mockedSampleAddress)
				let raisedException = false
				try{
					await cruxClient.resolveCurrencyAddressForCruxID("syedhassanashraf@cruxdev.crux", "ETH")
				}catch(e){
					raisedException = true
					sinon.assert.match(e.toString(), sinon.match('AssetIDNotAvailable'))
				}finally{
					expect(raisedException).to.equal(true)
					clientMappingStub.restore()
					addressMappingStub.restore()
				}
			})
		})
	})

})
