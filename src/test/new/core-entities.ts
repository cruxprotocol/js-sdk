import {
    CruxUser, IAddress, IAddressMapping,
    ICruxUserRegistrationStatus,
    SubdomainRegistrationStatus,
    SubdomainRegistrationStatusDetail
} from "../../core/entities/crux-user";
import {CruxId} from "../../packages/identity-utils";
import {expect} from 'chai';

const testCruxId = CruxId.fromString('foobar@somewallet.crux');
const testAddress: IAddress = {
    'addressHash': 'foobtcaddress'
};
const BTC_ASSET_ID: string = 'd78c26f8-7c13-4909-bf62-57d7623f8ee8';
const testValidAddressMap: IAddressMapping = {[BTC_ASSET_ID]: testAddress};
const testInvalidAddressMap = {'invalidAssetId': testAddress};
const newUserRegStatus: ICruxUserRegistrationStatus = {
    'status': SubdomainRegistrationStatus.NONE,
    'statusDetail': SubdomainRegistrationStatusDetail.NONE
};

describe('Core Entities Tests', () => {
    describe('Testing Entity CruxUser', () => {
        it('Valid CruxUser can be created', () => {
            const testUser = new CruxUser(testCruxId, testValidAddressMap, newUserRegStatus);
            expect(testUser.cruxID.toString()).to.be.equal(testCruxId.toString());
        });
        it('CruxUser should not be constructed with invalid address map', () => {
            const createInvalidUser = () => new CruxUser(testCruxId, testInvalidAddressMap, newUserRegStatus);
            expect(createInvalidUser).to.throw();
        });
        it('Valid CruxUser getAddress method works as expected', () => {
            const testUser = new CruxUser(testCruxId, testValidAddressMap, newUserRegStatus);
            const testUserBtcAddressHash = testUser.getAddressMap()[BTC_ASSET_ID]['addressHash'];
            expect(testUserBtcAddressHash).to.be.equal(testValidAddressMap[BTC_ASSET_ID]['addressHash']);
        });

    });
    describe('Testing Entity CruxDomain', () => {

        it('CruxDomain should not be constructed with invalid config', () => {

        });
        it('CruxDomain should not be constructed with invalid status', () => {

        });

    });

});
