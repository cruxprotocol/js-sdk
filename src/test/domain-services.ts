import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import 'mocha';
import { CruxUserAddressResolver, ICruxUserConfiguration, IAddressMapping, IAddress, IAssetMatcher } from '../core/entities/crux-user';
import { IGlobalAssetList, IGlobalAsset } from '../core/entities/crux-domain';
chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;

describe('Testing domain services', () => {
    describe('CruxUserAddressResolver tests', () => {
        const ethERC20FallbackKey = "ERC20_4e4d9982-3469-421b-ab60-2c0c2f05386a";
        const ethAsset: IGlobalAsset = {
            "assetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a",
            "symbol": "ETH",
            "name": "Ethereum",
            "assetType": null,
            "decimals": 8,
            "assetIdentifierName": null,
            "assetIdentifierValue": null,
            "parentAssetId": null
        };
        const zrxAsset: IGlobalAsset = {
            "assetId": "ed919ad4-c0d0-42a7-a2b3-9728cbb81f26",
            "symbol": "ZRX",
            "name": "0x Protocol Token",
            "assetType": "ERC20",
            "decimals": 18,
            "assetIdentifierName": "Contract Address",
            "assetIdentifierValue": "0xE41d2489571d322189246DaFA5ebDe1F4699F498",
            "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        };
        const omgAsset: IGlobalAsset = {
            "assetId": "1c70b1cd-0bc2-4ea4-a3d2-c031fcdd04e5",
            "symbol": "OMG",
            "name": "OMGToken",
            "assetType": "ERC20",
            "decimals": 18,
            "assetIdentifierName": "Contract Address",
            "assetIdentifierValue": "0xd26114cd6EE289AccF82350c8d8487fedB8A0C07",
            "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        }
        const testEthAddress: IAddress = {
            addressHash: "0x0a2311594059b468c9897338b027c8782398b481",
        };
        const testOmgAddress: IAddress = {
            addressHash: "0xd26114cd6ee289accf82350c8d8487fedb8a0c07",
        }
        describe('resolveAddressWithAsset tests', () => {
            it('resolving OMG -- config disabled  || asset absent || address absent', () => {
                // mock-fixtures
                const userAssetList: IGlobalAssetList = [ethAsset, zrxAsset];
                const userConfig: ICruxUserConfiguration = {enabledParentAssetFallbacks: []};
                const userAddressMap: IAddressMapping = {};
                userAddressMap[ethAsset.assetId] = testEthAddress
                // execution
                const asset = omgAsset;
                const addressResolver = new CruxUserAddressResolver(userAddressMap, userAssetList, userConfig);
                const address = addressResolver.resolveAddressWithAsset(asset);
                // expectations - should NOT resolve the parentAsset's address
                expect(address).to.be.undefined;
            })
            it('resolving OMG -- config enabled  || asset absent || address absent', () => {
                // mock-fixtures
                const userAssetList: IGlobalAssetList = [ethAsset, zrxAsset];
                const userConfig: ICruxUserConfiguration = {enabledParentAssetFallbacks: [ethERC20FallbackKey]};
                const userAddressMap: IAddressMapping = {};
                userAddressMap[ethAsset.assetId] = testEthAddress
                // execution
                const asset = omgAsset;
                const addressResolver = new CruxUserAddressResolver(userAddressMap, userAssetList, userConfig);
                const address = addressResolver.resolveAddressWithAsset(asset);
                // expectations - should resolve the parentAsset's address
                expect(address).to.be.eql(testEthAddress);
            })
            it('resolving OMG -- config enabled  || asset present || address absent', () => {
                // mock-fixtures
                const userAssetList: IGlobalAssetList = [ethAsset, zrxAsset, omgAsset];
                const userConfig: ICruxUserConfiguration = {enabledParentAssetFallbacks: [ethERC20FallbackKey]};
                const userAddressMap: IAddressMapping = {};
                userAddressMap[ethAsset.assetId] = testEthAddress
                // execution
                const asset = omgAsset;
                const addressResolver = new CruxUserAddressResolver(userAddressMap, userAssetList, userConfig);
                const address = addressResolver.resolveAddressWithAsset(asset);
                // expectations - should resolve the parentAsset's address
                expect(address).to.be.eql(testEthAddress);
            })
            it('resolving OMG -- config enabled  || asset present || address present', () => {
                // mock-fixtures
                const userAssetList: IGlobalAssetList = [ethAsset, zrxAsset, omgAsset];
                const userConfig: ICruxUserConfiguration = {enabledParentAssetFallbacks: [ethERC20FallbackKey]};
                const userAddressMap: IAddressMapping = {};
                userAddressMap[ethAsset.assetId] = testEthAddress;
                userAddressMap[omgAsset.assetId] = testOmgAddress;
                // execution
                const asset = omgAsset;
                const addressResolver = new CruxUserAddressResolver(userAddressMap, userAssetList, userConfig);
                const address = addressResolver.resolveAddressWithAsset(asset);
                // expectations - should resolve OMG specific address
                expect(address).to.be.eql(testOmgAddress);
            })
            it('(NOT expected case) resolving OMG -- config disabled  || asset absent || address present', () => {
                // mock-fixtures
                const userAssetList: IGlobalAssetList = [ethAsset, zrxAsset];
                const userConfig: ICruxUserConfiguration = {enabledParentAssetFallbacks: []};
                const userAddressMap: IAddressMapping = {};
                userAddressMap[ethAsset.assetId] = testEthAddress;
                userAddressMap[omgAsset.assetId] = testOmgAddress;
                // execution
                const asset = omgAsset;
                const addressResolver = new CruxUserAddressResolver(userAddressMap, userAssetList, userConfig);
                const address = addressResolver.resolveAddressWithAsset(asset);
                // expectations - should resolve OMG specific address
                expect(address).to.be.eql(testOmgAddress);
            })
        })
        describe('resolveAddressWithAssetMatcher tests', () => {
            it('resolving ether ERC20 -- config disabled  || asset absent || address absent', () => {
                // mock-fixtures
                const userAssetList: IGlobalAssetList = [zrxAsset];
                const userConfig: ICruxUserConfiguration = {enabledParentAssetFallbacks: []};
                const userAddressMap: IAddressMapping = {};
                // execution
                const assetMatcher: IAssetMatcher = {assetGroup: ethERC20FallbackKey};
                const addressResolver = new CruxUserAddressResolver(userAddressMap, userAssetList, userConfig);
                const address = addressResolver.resolveAddressWithAssetMatcher(assetMatcher);
                // expectations - should NOT resolve the parentAsset's address
                expect(address).to.be.undefined;
            })
            it('resolving ether ERC20 -- config disabled  || asset present || address absent', () => {
                // mock-fixtures
                const userAssetList: IGlobalAssetList = [ethAsset, zrxAsset];
                const userConfig: ICruxUserConfiguration = {enabledParentAssetFallbacks: []};
                const userAddressMap: IAddressMapping = {};
                // execution
                const assetMatcher: IAssetMatcher = {assetGroup: ethERC20FallbackKey};
                const addressResolver = new CruxUserAddressResolver(userAddressMap, userAssetList, userConfig);
                const address = addressResolver.resolveAddressWithAssetMatcher(assetMatcher);
                // expectations - should NOT resolve the parentAsset's address
                expect(address).to.be.undefined;
            })
            it('resolving ether ERC20 -- config disabled  || asset present || address present', () => {
                // mock-fixtures
                const userAssetList: IGlobalAssetList = [ethAsset, zrxAsset];
                const userConfig: ICruxUserConfiguration = {enabledParentAssetFallbacks: []};
                const userAddressMap: IAddressMapping = {};
                userAddressMap[ethAsset.assetId] = testEthAddress;
                // execution
                const assetMatcher: IAssetMatcher = {assetGroup: ethERC20FallbackKey};
                const addressResolver = new CruxUserAddressResolver(userAddressMap, userAssetList, userConfig);
                const address = addressResolver.resolveAddressWithAssetMatcher(assetMatcher);
                // expectations - should NOT resolve the parentAsset's address
                expect(address).to.be.undefined;
            })
            it('resolving ether ERC20 -- config enabled  || asset present || address absent', () => {
                // mock-fixtures
                const userAssetList: IGlobalAssetList = [ethAsset, zrxAsset];
                const userConfig: ICruxUserConfiguration = {enabledParentAssetFallbacks: [ethERC20FallbackKey]};
                const userAddressMap: IAddressMapping = {};
                // execution
                const assetMatcher: IAssetMatcher = {assetGroup: ethERC20FallbackKey};
                const addressResolver = new CruxUserAddressResolver(userAddressMap, userAssetList, userConfig);
                const address = addressResolver.resolveAddressWithAssetMatcher(assetMatcher);
                // expectations - should NOT resolve the parentAsset's address
                expect(address).to.be.undefined;
            })
            it('resolving ether ERC20 -- config enabled  || asset present || address present', () => {
                // mock-fixtures
                const userAssetList: IGlobalAssetList = [ethAsset, zrxAsset];
                const userConfig: ICruxUserConfiguration = {enabledParentAssetFallbacks: [ethERC20FallbackKey]};
                const userAddressMap: IAddressMapping = {};
                userAddressMap[ethAsset.assetId] = testEthAddress;
                // execution
                const assetMatcher: IAssetMatcher = {assetGroup: ethERC20FallbackKey};
                const addressResolver = new CruxUserAddressResolver(userAddressMap, userAssetList, userConfig);
                const address = addressResolver.resolveAddressWithAssetMatcher(assetMatcher);
                // expectations - should resolve the parentAsset's address
                expect(address).to.be.eql(testEthAddress);
            })
            it('resolving with OMG contract -- config disabled  || asset absent || address absent', () => {
                // mock-fixtures
                const userAssetList: IGlobalAssetList = [ethAsset, zrxAsset];
                const userConfig: ICruxUserConfiguration = {enabledParentAssetFallbacks: []};
                const userAddressMap: IAddressMapping = {};
                userAddressMap[ethAsset.assetId] = testEthAddress;
                // execution
                const assetMatcher: IAssetMatcher = {assetGroup: ethERC20FallbackKey, assetIdentifierValue: omgAsset.assetIdentifierValue};
                const addressResolver = new CruxUserAddressResolver(userAddressMap, userAssetList, userConfig);
                const address = addressResolver.resolveAddressWithAssetMatcher(assetMatcher);
                // expectations - should NOT resolve the parentAsset's address
                expect(address).to.be.undefined;
            })
            it('resolving with OMG contract -- config enabled  || asset absent || address absent', () => {
                // mock-fixtures
                const userAssetList: IGlobalAssetList = [ethAsset, zrxAsset];
                const userConfig: ICruxUserConfiguration = {enabledParentAssetFallbacks: [ethERC20FallbackKey]};
                const userAddressMap: IAddressMapping = {};
                userAddressMap[ethAsset.assetId] = testEthAddress;
                // execution
                const assetMatcher: IAssetMatcher = {assetGroup: ethERC20FallbackKey, assetIdentifierValue: omgAsset.assetIdentifierValue};
                const addressResolver = new CruxUserAddressResolver(userAddressMap, userAssetList, userConfig);
                const address = addressResolver.resolveAddressWithAssetMatcher(assetMatcher);
                // expectations - should resolve the parentAsset's address
                expect(address).to.be.eql(testEthAddress);
            })
            it('resolving with OMG contract -- config enabled  || asset present || address absent', () => {
                // mock-fixtures
                const userAssetList: IGlobalAssetList = [ethAsset, zrxAsset, omgAsset];
                const userConfig: ICruxUserConfiguration = {enabledParentAssetFallbacks: [ethERC20FallbackKey]};
                const userAddressMap: IAddressMapping = {};
                userAddressMap[ethAsset.assetId] = testEthAddress;
                // execution
                const assetMatcher: IAssetMatcher = {assetGroup: ethERC20FallbackKey, assetIdentifierValue: omgAsset.assetIdentifierValue};
                const addressResolver = new CruxUserAddressResolver(userAddressMap, userAssetList, userConfig);
                const address = addressResolver.resolveAddressWithAssetMatcher(assetMatcher);
                // expectations - should resolve the parentAsset's address
                expect(address).to.be.eql(testEthAddress);
            })
            it('resolving with OMG contract -- config enabled  || asset present || address present', () => {
                // mock-fixtures
                const userAssetList: IGlobalAssetList = [ethAsset, zrxAsset, omgAsset];
                const userConfig: ICruxUserConfiguration = {enabledParentAssetFallbacks: [ethERC20FallbackKey]};
                const userAddressMap: IAddressMapping = {};
                userAddressMap[ethAsset.assetId] = testEthAddress;
                userAddressMap[omgAsset.assetId] = testOmgAddress;
                // execution
                const assetMatcher: IAssetMatcher = {assetGroup: ethERC20FallbackKey, assetIdentifierValue: omgAsset.assetIdentifierValue};
                const addressResolver = new CruxUserAddressResolver(userAddressMap, userAssetList, userConfig);
                const address = addressResolver.resolveAddressWithAssetMatcher(assetMatcher);
                // expectations - should resolve OMG specific address
                expect(address).to.be.eql(testOmgAddress);
            })
        })
    })
})
