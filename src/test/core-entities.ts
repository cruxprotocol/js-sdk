import {CruxDomain, DomainRegistrationStatus, IClientConfig} from "../core/entities/crux-domain";
import {CruxSpec} from "../core/entities/crux-spec";
import {
    CruxUser, IAddress, IAddressMapping,
    ICruxUserRegistrationStatus,
    ICruxUserInformation,
    SubdomainRegistrationStatus,
    SubdomainRegistrationStatusDetail,
    ICruxUserData
} from "../core/entities/crux-user";
import {CruxDomainId, CruxId} from "../packages/identity-utils";
import {expect} from 'chai';

describe('Core Entities Tests', () => {

    describe('Testing Entity CruxUser', () => {

        const testCruxId = CruxId.fromString('foobar@somewallet.crux');
        const testAddress: IAddress = {
            'addressHash': 'foobtcaddress'
        };
        const transactionHash: string = 'NONE';
        const ownerAddress: string = 'NONE';
        const BTC_ASSET_ID: string = 'd78c26f8-7c13-4909-bf62-57d7623f8ee8';
        const testValidAddressMap: IAddressMapping = {[BTC_ASSET_ID]: testAddress};
        const testInvalidAddressMap = {'invalidAssetId': testAddress};
        const newUserRegStatus: ICruxUserRegistrationStatus = {
            'status': SubdomainRegistrationStatus.NONE,
            'statusDetail': SubdomainRegistrationStatusDetail.NONE
        };
        const newUserInformation: ICruxUserInformation = {
            'registrationStatus': newUserRegStatus,
            'transactionHash': transactionHash,
            'ownerAddress': ownerAddress
        };
        const newUserData: ICruxUserData = {
            'configuration': {enabledParentAssetFallbacks: []}
        }

        it('Valid CruxUser can be created', () => {
            const testUser = new CruxUser(testCruxId, testValidAddressMap, newUserInformation, newUserData);
            expect(testUser.cruxID.toString()).to.be.equal(testCruxId.toString());
        });
        it('CruxUser should not be constructed with invalid address map', () => {
            const createInvalidUser = () => new CruxUser(testCruxId, testInvalidAddressMap, newUserInformation, newUserData);
            expect(createInvalidUser).to.throw();
        });
        it('Valid CruxUser getAddress method works as expected', () => {
            const testUser = new CruxUser(testCruxId, testValidAddressMap, newUserInformation, newUserData);
            const testUserBtcAddressHash = testUser.getAddressMap()[BTC_ASSET_ID]['addressHash'];
            expect(testUserBtcAddressHash).to.be.equal(testValidAddressMap[BTC_ASSET_ID]['addressHash']);
        });
        it('CruxUser should not be constructed with invalid CruxId', () => {
            const createInvalidUser = () => new CruxUser(undefined, {}, newUserInformation, newUserData);
            expect(createInvalidUser).to.throw();
        })

    });
    describe('Testing Entity CruxDomain', () => {
        const testCruxDomainId = CruxDomainId.fromString('somewallet.crux');
        const availableDomainStatus: DomainRegistrationStatus = DomainRegistrationStatus.AVAILABLE;
        const testValidDomainAssetMapping = {
            'bitcoin': 'd78c26f8-7c13-4909-bf62-57d7623f8ee8'
        };
        const testInvalidDomainAssetMapping = {
            'bitcoin': 'someInvalidAssetId'
        };
        const testValidDomainConfig: IClientConfig = {
            assetMapping: testValidDomainAssetMapping,
            assetList: CruxSpec.globalAssetList.filter((asset) => Object.values(testValidDomainAssetMapping).includes(asset.assetId)),
            supportedParentAssetFallbacks: [],
        };
        const testInvalidDomainConfig: IClientConfig = {
            assetMapping: testInvalidDomainAssetMapping,
            assetList: CruxSpec.globalAssetList.filter((asset) => Object.values(testInvalidDomainAssetMapping).includes(asset.assetId)),
            supportedParentAssetFallbacks: [],
        };
        it('Valid CruxDomain should be constructed', () => {
            const testDomain = new CruxDomain(testCruxDomainId, availableDomainStatus, testValidDomainConfig);
            expect(testDomain).to.be.instanceOf(CruxDomain);

        });
        it('CruxDomain should not be constructed with invalid asset mapping', () => {
            const makeInvalidDomain = () => new CruxDomain(testCruxDomainId, availableDomainStatus, testInvalidDomainConfig);
            expect(makeInvalidDomain).to.throw();
        });
        it('CruxDomain should not be constructed with invalid status', () => {
            // @ts-ignore
            const makeInvalidDomain = () => new CruxDomain(testCruxDomainId, 'FOOBAR', testValidDomainConfig);
            expect(makeInvalidDomain).to.throw();
        });

    });

});
