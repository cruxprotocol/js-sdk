import { expect } from 'chai';
import 'mocha';
import { getContentFromGaiaHub } from '../packages/gaia-service/utils';
import { UPLOADABLE_JSON_FILES } from '../packages/name-service/blockstack-service';
import { errors } from '../packages';
import * as utils from "../packages/utils";
import sinon from 'sinon';
import requestFixtures from "./requestMocks/nameservice-reqmocks";
import * as blockstack from 'blockstack';
import config from '../config';



describe('getContentFromGaiaHub tests', () => {
    let httpJSONRequestStub: sinon.SinonStub;
    let verifyProfileTokenStub: sinon.SinonStub;
    let publicKeyToAddressStub: sinon.SinonStub;

    beforeEach(() => {
        httpJSONRequestStub = sinon.stub(utils, 'httpJSONRequest').throws('unhandled in mocks')
        verifyProfileTokenStub = sinon.stub(blockstack, 'verifyProfileToken').resolves("mocked verification")
        publicKeyToAddressStub = sinon.stub(blockstack, 'publicKeyToAddress').resolves("mocked public address")

        requestFixtures.forEach(requestObj => {
            httpJSONRequestStub.withArgs(requestObj.request).returns(requestObj.response)
        })
    });

    afterEach(() => {
        httpJSONRequestStub.restore()
        verifyProfileTokenStub.restore()
        publicKeyToAddressStub.restore()
        localStorage.clear()
    });
    it('if it fails to get file content throws filename specific error', async () => {
        let request = {
            method: 'GET',
            url: 'https://gaia.cruxpay.com/1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ/client-config.json',
            json: true
        }
        httpJSONRequestStub.withArgs(request).throws("sample exception")
        
        let raisedError
        try {
            await getContentFromGaiaHub('cs1.devcoinswitch_crux.id', UPLOADABLE_JSON_FILES.CLIENT_CONFIG, config.BLOCKSTACK.BNS_NODES)
        }
        catch (error) {
            raisedError = error
        }
        expect(httpJSONRequestStub.callCount).to.be.equal(3)
        expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.GaiaClientConfigUploadFailed)
    });
    it('given token and public key, if blockstack validation fails, throws "TokenVerificationFailed"', async() => {
        let raisedError
        verifyProfileTokenStub.throws("sample exception")
        try {
            await getContentFromGaiaHub('cs1.devcoinswitch_crux.id', UPLOADABLE_JSON_FILES.CRUXPAY, config.BLOCKSTACK.BNS_NODES)
        } catch (error) {
            raisedError = error
      }
        expect(httpJSONRequestStub.callCount).to.be.equal(3)
        expect(verifyProfileTokenStub.callCount).to.be.equal(1)
        expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.TokenVerificationFailed)
    })

    it('address from gaiahub and address derived from blockstack mismatch throws "CouldNotValidateZoneFile"', async() => {
        let raisedError
        publicKeyToAddressStub.resolves("some address")
        try {
            await getContentFromGaiaHub('cs1.devcoinswitch_crux.id', UPLOADABLE_JSON_FILES.CRUXPAY, config.BLOCKSTACK.BNS_NODES)
        } catch (error) {
            raisedError = error
      }
        expect(httpJSONRequestStub.callCount).to.be.equal(3)
        expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.CouldNotValidateZoneFile)
    })
});
