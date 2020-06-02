import {
    CruxDomain,
    CruxSpec,
    CruxUser,
    DomainRegistrationStatus,
    IAddress,
    IAddressMapping,
    IClientConfig, ICruxUserData, ICruxUserInformation, SubdomainRegistrationStatus, SubdomainRegistrationStatusDetail
} from "../../core/entities";
import {CruxDomainId, CruxId, getKeyPairFromPrivKey} from "../../packages";

export const getCstestwalletCruxDomain = () => {
    const testCruxDomainId = CruxDomainId.fromString('cstestwallet.crux');
    const domainStatus: DomainRegistrationStatus = DomainRegistrationStatus.REGISTERED;
    const testValidDomainAssetMapping = {
        'bitcoin': 'd78c26f8-7c13-4909-bf62-57d7623f8ee8',
        'ethereum': '4e4d9982-3469-421b-ab60-2c0c2f05386a'
    };
    const testValidDomainConfig: IClientConfig = {
        assetMapping: testValidDomainAssetMapping,
        assetList: CruxSpec.globalAssetList.filter((asset) => Object.values(testValidDomainAssetMapping).includes(asset.assetId)),
        supportedAssetGroups: [],
    };
    return new CruxDomain(testCruxDomainId, domainStatus, testValidDomainConfig);
};

export const getMockUserFoo123CSTestWallet = () => {
    const testPvtKey = '6bd397dc89272e71165a0e7d197b280c7a88ed5b1e44e1928c25455506f1968f';
    const cstestwalletDomain = getCstestwalletCruxDomain();
    const testCruxId = CruxId.fromString('foo123@cstestwallet.crux');
    const testAddress: IAddress = {
        'addressHash': 'FOO123_MOCK_BTC_ADDRESS'
    };
    const BTC_ASSET_ID: string = 'd78c26f8-7c13-4909-bf62-57d7623f8ee8';
    const testValidAddressMap: IAddressMapping = {[BTC_ASSET_ID]: testAddress};
    const validUserInformation: ICruxUserInformation = {
        registrationStatus: {
            'status': SubdomainRegistrationStatus.DONE,
            'statusDetail': SubdomainRegistrationStatusDetail.DONE,
        }
    };
    const validCruxUserData: ICruxUserData = {
        configuration: {
            enabledAssetGroups: [],
            blacklistedCruxUsers: []
        },
        privateAddresses: {}
    }
    const keyData = getKeyPairFromPrivKey(testPvtKey)
    return {
        cruxUser: new CruxUser(testCruxId.components.subdomain, cstestwalletDomain , testValidAddressMap, validUserInformation, validCruxUserData, keyData.pubKey),
        pvtKey: testPvtKey
    };
}


export const getMockUserBar123CSTestWallet = () => {
    const testPvtKey = '12381ab829318742938647283cd462738462873642ef34abefcd123501827193';
    const cstestwalletDomain = getCstestwalletCruxDomain();
    const testCruxId = CruxId.fromString('bar123@cstestwallet.crux');
    const testAddress: IAddress = {
        'addressHash': 'BAR123_MOCK_BTC_ADDRESS'
    };
    const BTC_ASSET_ID: string = 'd78c26f8-7c13-4909-bf62-57d7623f8ee8';
    const testValidAddressMap: IAddressMapping = {[BTC_ASSET_ID]: testAddress};
    const validUserInformation: ICruxUserInformation = {
        registrationStatus: {
            'status': SubdomainRegistrationStatus.DONE,
            'statusDetail': SubdomainRegistrationStatusDetail.DONE,
        }
    };
    const validCruxUserData: ICruxUserData = {
        configuration: {
            enabledAssetGroups: [],
            blacklistedCruxUsers: []
        },
        privateAddresses: {}
    }
    const keyData = getKeyPairFromPrivKey(testPvtKey)
    return {
        cruxUser: new CruxUser(testCruxId.components.subdomain, cstestwalletDomain , testValidAddressMap, validUserInformation, validCruxUserData, keyData.pubKey),
        pvtKey: testPvtKey
    };
};

export const getMockUserFooBar123CSTestWallet = () => {
    const testPvtKey = '2982735d0b69751e1d13fcb045757e372c1d85b8bdc66995a5a073be648e5f26';
    const cstestwalletDomain = getCstestwalletCruxDomain();
    const testCruxId = CruxId.fromString('foobar123@cstestwallet.crux');
    const testAddress: IAddress = {
        'addressHash': 'FOOBAR123_MOCK_BTC_ADDRESS'
    };
    const BTC_ASSET_ID: string = 'd78c26f8-7c13-4909-bf62-57d7623f8ee8';
    const testValidAddressMap: IAddressMapping = {[BTC_ASSET_ID]: testAddress};
    const validUserInformation: ICruxUserInformation = {
        registrationStatus: {
            'status': SubdomainRegistrationStatus.DONE,
            'statusDetail': SubdomainRegistrationStatusDetail.DONE,
        }
    };
    const validCruxUserData: ICruxUserData = {
        configuration: {
            enabledAssetGroups: [],
            blacklistedCruxUsers: []
        },
        privateAddresses: {}
    }
    const keyData = getKeyPairFromPrivKey(testPvtKey)
    return {
        cruxUser: new CruxUser(testCruxId.components.subdomain, cstestwalletDomain , testValidAddressMap, validUserInformation, validCruxUserData, keyData.pubKey),
        pvtKey: testPvtKey
    };
}
