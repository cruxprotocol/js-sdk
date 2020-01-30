import { CruxAssetTranslator, IClientAssetMapping, IGlobalAssetList, IParentFallbackKeyDetails, IAssetMatcher } from "../application/services/crux-asset-translator";
import { CruxAddressResolver } from "../application/services/curx-address-resolver";
import { expect } from 'chai';
import { CruxUser, SubdomainRegistrationStatus, SubdomainRegistrationStatusDetail } from "../core/entities/crux-user";
import { CruxId } from "../packages/identity-utils";
import { PackageError, PackageErrorCode } from "../packages";
describe('Application Services Tests', () => {
    describe('Testing AssetTranslator', () => {
        const testClientAssetList: IGlobalAssetList = [
            {
                "assetId": "b0115257-13f2-4fb1-8796-07becdcacf8f",
                "symbol": "XTZ",
                "name": "Tezos",
                "assetType": null,
                "decimals": 3,
                "assetIdentifierName": null,
                "assetIdentifierValue": null,
                "parentAssetId": null
            },
            {
                "assetId": "ab212c90-a2ab-48cf-873c-a7b6e97d8935",
                "symbol": "TRX",
                "name": "TRON",
                "assetType": null,
                "decimals": 6,
                "assetIdentifierName": null,
                "assetIdentifierValue": null,
                "parentAssetId": null
            },
            {
                "assetId": "d88f558a-7a0e-4cd4-8629-07e5f7326a3c",
                "symbol": "BNB",
                "name": "Binance Coin",
                "assetType": null,
                "decimals": 8,
                "assetIdentifierName": null,
                "assetIdentifierValue": null,
                "parentAssetId": null
            },
            {
                "assetId": "7333c9c9-976a-4045-b6fa-176ac13ddf6d",
                "symbol": "XEM",
                "name": "NEM",
                "assetType": null,
                "decimals": 6,
                "assetIdentifierName": null,
                "assetIdentifierValue": null,
                "parentAssetId": null
            },
            {
                "assetId": "1c70b1cd-0bc2-4ea4-a3d2-c031fcdd04e5",
                "symbol": "OMG",
                "name": "OMGToken",
                "assetType": "ERC20",
                "decimals": 18,
                "assetIdentifierName": "Contract Address",
                "assetIdentifierValue": "0xd26114cd6EE289AccF82350c8d8487fedB8A0C07",
                "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
            }
        ]
        const testClientAssetMapping: IClientAssetMapping = {
            "XTZ": "b0115257-13f2-4fb1-8796-07becdcacf8f",
            "TRX": "ab212c90-a2ab-48cf-873c-a7b6e97d8935",
            "BNB": "d88f558a-7a0e-4cd4-8629-07e5f7326a3c",
            "XEM": "7333c9c9-976a-4045-b6fa-176ac13ddf6d",
            "XMR": "d4b874c4-7cf7-456f-8225-eb20e33767f2",
            "ETH": "4e4d9982-3469-421b-ab60-2c0c2f05386a",
            "DASH": "5ed4d7ac-f741-4af0-bca9-3c02acd00beb",
            "OMG": "1c70b1cd-0bc2-4ea4-a3d2-c031fcdd04e5",
        }
        const testClientParentFallbackKeyDetails: IParentFallbackKeyDetails = {
            symbolFallbackKey: "ERC20_eth",
            assetIdFallbackKey: "ERC20_4e4d9982-3469-421b-ab60-2c0c2f05386a",
            parentAssetId: "4e4d9982-3469-421b-ab60-2c0c2f05386a",
            assetType: "ERC20",
        }
        let cruxAssetTranslator: CruxAssetTranslator = new CruxAssetTranslator(testClientAssetMapping, testClientAssetList);
        let testUserAssetIdAddressMap = {
            "ab212c90-a2ab-48cf-873c-a7b6e97d8935" : {
                "addressHash" : "TX8kMjdU9ZVMVwPBCKjzhZxFNqmMWRY7KF"
            },
            "5ed4d7ac-f741-4af0-bca9-3c02acd00beb" : {
                "addressHash" : "XkHmWWocGH5iGyo7gAaVDVjBYEfo98w66A"
            },
            "d4b874c4-7cf7-456f-8225-eb20e33767f2":{
                "addressHash" : "4B55CzRGBAcfysixFcPffSTe2bRFkjDEcAb5mKXbbjuR8uHRZjsf3BXUkh6qhiswqsDxpNcx3xhjPJ7XezZrwEaL1ybRzoD"
            }
        }
        let testUserUpperCaseCurrencyAddressMap = {
            "TRX" : {
                "addressHash" : "TX8kMjdU9ZVMVwPBCKjzhZxFNqmMWRY7KF"
            },
            "DASH" : {
                "addressHash" : "XkHmWWocGH5iGyo7gAaVDVjBYEfo98w66A"
            },
            "XMR" : {
                "addressHash" : "4B55CzRGBAcfysixFcPffSTe2bRFkjDEcAb5mKXbbjuR8uHRZjsf3BXUkh6qhiswqsDxpNcx3xhjPJ7XezZrwEaL1ybRzoD"
            }
        }
        let testUserLowerCaseCurrencyAddressMap = {
            "trx" : {
                "addressHash" : "TX8kMjdU9ZVMVwPBCKjzhZxFNqmMWRY7KF"
            },
            "dash" : {
                "addressHash" : "XkHmWWocGH5iGyo7gAaVDVjBYEfo98w66A"
            },
            "xmr" : {
                "addressHash" : "4B55CzRGBAcfysixFcPffSTe2bRFkjDEcAb5mKXbbjuR8uHRZjsf3BXUkh6qhiswqsDxpNcx3xhjPJ7XezZrwEaL1ybRzoD"
            }
        }
        it('Translate symbolParentAssetFallbackKey to parentFallbackKeyDetails', () => {
            const parentFallbackKeyDetails = cruxAssetTranslator.symbolParentFallbackKeyToParentFallbackKeyDetails(testClientParentFallbackKeyDetails.symbolFallbackKey);
            expect(parentFallbackKeyDetails).is.eql(testClientParentFallbackKeyDetails);
        })
        it('Translate assetId to parentFallbackKeyDetails', () => {
            const parentFallbackKeyDetails = cruxAssetTranslator.assetIdToParentFallbackKeyDetails(testClientAssetMapping['OMG']);
            expect(parentFallbackKeyDetails).is.eql(testClientParentFallbackKeyDetails);
        })
        it('Tanslate assetMatcher to IGlobalAsset', () => {
            const mockAsset = testClientAssetList.find((a) => a.assetId === "1c70b1cd-0bc2-4ea4-a3d2-c031fcdd04e5");
            const assetMatcher: IAssetMatcher = {
                assetGroup: "ERC20_eth",
                assetIdentifierValue: mockAsset.assetIdentifierValue,
            }
            const asset = cruxAssetTranslator.assetMatcherToAsset(assetMatcher);
            expect(asset).is.eql(mockAsset)
        })
        it('Translate symbolAddressMap to assetIdAddressMap', ()=>{
            const assetIdAddressMap = cruxAssetTranslator.symbolAddressMapToAssetIdAddressMap(testUserUpperCaseCurrencyAddressMap);
            console.log(assetIdAddressMap)
            expect(assetIdAddressMap).is.eql({
                assetAddressMap: testUserAssetIdAddressMap,
                success: testUserLowerCaseCurrencyAddressMap,
                failures: {}
            });
        })
        it('Translate symbolAddressMap to assetIdAddressMap failure case', ()=>{
            const testAddressMap = Object.assign({}, testUserUpperCaseCurrencyAddressMap);
            testAddressMap["ZRX"] = {
                "addressHash" : "0x5c9F3ffF6ee846a83080F373F8ceA1451bB4a3D9"
            }
            const assetIdAddressMap = cruxAssetTranslator.symbolAddressMapToAssetIdAddressMap(testAddressMap);
            expect(assetIdAddressMap).is.eql({
                assetAddressMap: testUserAssetIdAddressMap,
                success: testUserLowerCaseCurrencyAddressMap,
                failures: {
                    "zrx": "4011: Currency does not exist in wallet's client mapping"
                }
            });
        })
        it('Translate assetIdAddressMap to symbolAddressMap', ()=>{
            const symbolAddressMap = cruxAssetTranslator.assetIdAddressMapToSymbolAddressMap(testUserAssetIdAddressMap);
            expect(symbolAddressMap).is.eql(testUserLowerCaseCurrencyAddressMap);
        })

        it('Translate assetIdAssetList to SymbolAssetMap', ()=>{
            const symbolAssetMap = cruxAssetTranslator.assetIdAssetListToSymbolAssetMap(testClientAssetList);
            expect(symbolAssetMap).is.eql({
                "xtz" : {
                    "assetId": "b0115257-13f2-4fb1-8796-07becdcacf8f",
                    "symbol": "XTZ",
                    "name": "Tezos",
                    "assetType": null,
                    "decimals": 3,
                    "assetIdentifierName": null,
                    "assetIdentifierValue": null,
                    "parentAssetId": null
                },
                "trx" : {
                    "assetId": "ab212c90-a2ab-48cf-873c-a7b6e97d8935",
                    "symbol": "TRX",
                    "name": "TRON",
                    "assetType": null,
                    "decimals": 6,
                    "assetIdentifierName": null,
                    "assetIdentifierValue": null,
                    "parentAssetId": null
                },
                "bnb" : {
                    "assetId": "d88f558a-7a0e-4cd4-8629-07e5f7326a3c",
                    "symbol": "BNB",
                    "name": "Binance Coin",
                    "assetType": null,
                    "decimals": 8,
                    "assetIdentifierName": null,
                    "assetIdentifierValue": null,
                    "parentAssetId": null
                },
                "xem" : {
                    "assetId": "7333c9c9-976a-4045-b6fa-176ac13ddf6d",
                    "symbol": "XEM",
                    "name": "NEM",
                    "assetType": null,
                    "decimals": 6,
                    "assetIdentifierName": null,
                    "assetIdentifierValue": null,
                    "parentAssetId": null
                },
                "omg": {
                    "assetId": "1c70b1cd-0bc2-4ea4-a3d2-c031fcdd04e5",
                    "symbol": "OMG",
                    "name": "OMGToken",
                    "assetType": "ERC20",
                    "decimals": 18,
                    "assetIdentifierName": "Contract Address",
                    "assetIdentifierValue": "0xd26114cd6EE289AccF82350c8d8487fedB8A0C07",
                    "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
                }
            });
        })
        it('Translate assetId to symbol', ()=>{
            const symbol = cruxAssetTranslator.assetIdToSymbol("ab212c90-a2ab-48cf-873c-a7b6e97d8935");
            expect(symbol).is.eql("trx");
        })
        it('Translate symbol to assetId', ()=>{
            const assetId = cruxAssetTranslator.symbolToAssetId("trx");
            expect(assetId).is.eql("ab212c90-a2ab-48cf-873c-a7b6e97d8935");
        })

    })
    describe('Testing CruxAddressResolver', () => {
        const testEthAddress = {
            addressHash: "0x0a2311594059b468c9897338b027c8782398b481",
        }
        const testOmgAddress = {
            addressHash: "0xd26114cd6ee289accf82350c8d8487fedb8a0c07",
        }
        const customAssetWalletUser = new CruxUser(
            CruxId.fromString("user@custom_asset_wallet.crux"),
            {
                "4e4d9982-3469-421b-ab60-2c0c2f05386a": testEthAddress,
                "1c70b1cd-0bc2-4ea4-a3d2-c031fcdd04e5": testOmgAddress,
            },
            {
                registrationStatus: {
                    status: SubdomainRegistrationStatus.DONE,
                    statusDetail: SubdomainRegistrationStatusDetail.DONE,
                }
            },
            {
                enabledParentAssetFallbacks: ["ERC20_4e4d9982-3469-421b-ab60-2c0c2f05386a"],
            }
        );
        const strictAssetWalletUser = new CruxUser(
            CruxId.fromString("user@strict_asset_wallet.crux"),
            {
                "4e4d9982-3469-421b-ab60-2c0c2f05386a": testEthAddress,
            },
            {
                registrationStatus: {
                    status: SubdomainRegistrationStatus.DONE,
                    statusDetail: SubdomainRegistrationStatusDetail.DONE,
                }
            },
            {
                enabledParentAssetFallbacks: [],
            }
        )
        const strictAssetWalletTranslator = new CruxAssetTranslator(
            {
                "eth": "4e4d9982-3469-421b-ab60-2c0c2f05386a",
                "zrx": "ed919ad4-c0d0-42a7-a2b3-9728cbb81f26",
            },
            [
                {
                    "assetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a",
                    "symbol": "ETH",
                    "name": "Ethereum",
                    "assetType": null,
                    "decimals": 8,
                    "assetIdentifierName": null,
                    "assetIdentifierValue": null,
                    "parentAssetId": null
                },
                {
                    "assetId": "ed919ad4-c0d0-42a7-a2b3-9728cbb81f26",
                    "symbol": "ZRX",
                    "name": "0x Protocol Token",
                    "assetType": "ERC20",
                    "decimals": 18,
                    "assetIdentifierName": "Contract Address",
                    "assetIdentifierValue": "0xE41d2489571d322189246DaFA5ebDe1F4699F498",
                    "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
                }
            ]
        )
        const customAssetWalletTranslator = new CruxAssetTranslator(
            {
                "eth": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
            },
            [
                {
                    "assetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a",
                    "symbol": "ETH",
                    "name": "Ethereum",
                    "assetType": null,
                    "decimals": 8,
                    "assetIdentifierName": null,
                    "assetIdentifierValue": null,
                    "parentAssetId": null
                },
                {
                    "assetId": "ed919ad4-c0d0-42a7-a2b3-9728cbb81f26",
                    "symbol": "ZRX",
                    "name": "0x Protocol Token",
                    "assetType": "ERC20",
                    "decimals": 18,
                    "assetIdentifierName": "Contract Address",
                    "assetIdentifierValue": "0xE41d2489571d322189246DaFA5ebDe1F4699F498",
                    "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
                },
                {
                    "assetId": "1c70b1cd-0bc2-4ea4-a3d2-c031fcdd04e5",
                    "symbol": "OMG",
                    "name": "OMGToken",
                    "assetType": "ERC20",
                    "decimals": 18,
                    "assetIdentifierName": "Contract Address",
                    "assetIdentifierValue": "0xd26114cd6EE289AccF82350c8d8487fedB8A0C07",
                    "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
                }
            ]
        )
        it('resolveAddressBySymbol test', () => {
            const walletCurrencySymbol = "zrx";
            const cruxAddressResolver = new CruxAddressResolver({
                cruxAssetTranslator: strictAssetWalletTranslator,
                cruxUser: customAssetWalletUser,
                userCruxAssetTranslator: customAssetWalletTranslator,
            });
            const resolvedAddress = cruxAddressResolver.resolveAddressBySymbol(walletCurrencySymbol);
            expect(resolvedAddress).to.be.eql(testEthAddress);
        })
        describe('resolveAddressByAssetMatcher tests', () => {
            it('sender resolving erc20 (address available with receiver)', () => {
                const assetMatcher: IAssetMatcher = {
                    assetGroup: "ERC20_eth",
                };
                const cruxAddressResolver = new CruxAddressResolver({
                    cruxAssetTranslator: strictAssetWalletTranslator,
                    cruxUser: customAssetWalletUser,
                    userCruxAssetTranslator: customAssetWalletTranslator,
                });
                const resolvedAddress = cruxAddressResolver.resolveAddressByAssetMatcher(assetMatcher);
                expect(resolvedAddress).to.be.eql(testEthAddress);
            })
            it('sender resolving using zrx contract address (without receiver asset information)', () => {
                const assetMatcher: IAssetMatcher = {
                    assetGroup: "ERC20_eth",
                    assetIdentifierValue: "0xE41d2489571d322189246DaFA5ebDe1F4699F498",
                };
                const cruxAddressResolver = new CruxAddressResolver({
                    cruxAssetTranslator: strictAssetWalletTranslator,
                    cruxUser: customAssetWalletUser,
                });
                let raisedError;
                try {
                    const resolvedAddress = cruxAddressResolver.resolveAddressByAssetMatcher(assetMatcher);
                } catch (error) {
                    raisedError = error;
                }
                expect(raisedError).to.be.not.undefined;
            })
            it('sender resolving omg (asset available with receiver) with omg specific address', () => {
                const assetMatcher: IAssetMatcher = {
                    assetGroup: "ERC20_eth",
                    assetIdentifierValue: "0xd26114cd6EE289AccF82350c8d8487fedB8A0C07",
                };
                const cruxAddressResolver = new CruxAddressResolver({
                    cruxAssetTranslator: strictAssetWalletTranslator,
                    cruxUser: customAssetWalletUser,
                    userCruxAssetTranslator: customAssetWalletTranslator,
                });
                let raisedError;
                const resolvedAddress = cruxAddressResolver.resolveAddressByAssetMatcher(assetMatcher);
                expect(resolvedAddress).to.be.eql(testOmgAddress);
            })
            it('sender resolving zrx (asset & address available with receiver)', () => {
                const assetMatcher: IAssetMatcher = {
                    assetGroup: "ERC20_eth",
                    assetIdentifierValue: "0xE41d2489571d322189246DaFA5ebDe1F4699F498",
                };
                const cruxAddressResolver = new CruxAddressResolver({
                    cruxAssetTranslator: strictAssetWalletTranslator,
                    cruxUser: customAssetWalletUser,
                    userCruxAssetTranslator: customAssetWalletTranslator,
                });
                const resolvedAddress = cruxAddressResolver.resolveAddressByAssetMatcher(assetMatcher);
                expect(resolvedAddress).to.be.eql(testEthAddress);
            })
            it('sender resolving life (asset & address not available with receiver)', () => {
                const assetMatcher: IAssetMatcher = {
                    assetGroup: "ERC20_eth",
                    assetIdentifierValue: "0xff18dbc487b4c2e3222d115952babfda8ba52f5f",
                };
                const cruxAddressResolver = new CruxAddressResolver({
                    cruxAssetTranslator: strictAssetWalletTranslator,
                    cruxUser: customAssetWalletUser,
                    userCruxAssetTranslator: customAssetWalletTranslator,
                });
                const resolvedAddress = cruxAddressResolver.resolveAddressByAssetMatcher(assetMatcher);
                expect(resolvedAddress).to.be.eql(testEthAddress);
            })
            it('sender resolving rbtc_erc20 (asset & addres not available with receiver)', () => {
                const assetMatcher: IAssetMatcher = {
                    assetGroup: "ERC20_rbtc",
                };
                const cruxAddressResolver = new CruxAddressResolver({
                    cruxAssetTranslator: strictAssetWalletTranslator,
                    cruxUser: customAssetWalletUser,
                    userCruxAssetTranslator: customAssetWalletTranslator,
                });
                let raisedError;
                try {
                    const resolvedAddress = cruxAddressResolver.resolveAddressByAssetMatcher(assetMatcher);
                } catch (error) {
                    raisedError = error;
                }
                expect(raisedError).to.be.not.undefined;
                expect(raisedError).to.be.instanceOf(PackageError);
                expect(raisedError["errorCode"]).to.be.equal(PackageErrorCode.AddressNotAvailable);
            })
        })
        it('resolveAddressWithAssetId test', () => {
            const assetId = "ed919ad4-c0d0-42a7-a2b3-9728cbb81f26";
            const cruxAddressResolver = new CruxAddressResolver({
                cruxAssetTranslator: strictAssetWalletTranslator,
                cruxUser: customAssetWalletUser,
                userCruxAssetTranslator: customAssetWalletTranslator,
            });
            const resolvedAddress = cruxAddressResolver.resolveAddressWithAssetId(assetId);
            expect(resolvedAddress).to.be.eql(testEthAddress);
        })
        describe('resolveAddressByAssetGroup tests', () => {
            it('sender resolving erc20 address (receiver has the fallback enabled)', () => {
                const assetGroup = "ERC20_eth";
                const cruxAddressResolver = new CruxAddressResolver({
                    cruxAssetTranslator: strictAssetWalletTranslator,
                    cruxUser: customAssetWalletUser,
                    userCruxAssetTranslator: customAssetWalletTranslator,
                });
                const resolvedAddress = cruxAddressResolver.resolveAddressByAssetGroup(assetGroup);
                expect(resolvedAddress).to.be.eql(testEthAddress);
            })
            it('sender resolving erc20 address (receiver has the fallback disabled)', () => {
                const assetGroup = "ERC20_eth";
                const cruxAddressResolver = new CruxAddressResolver({
                    cruxAssetTranslator: strictAssetWalletTranslator,
                    cruxUser: strictAssetWalletUser,
                    userCruxAssetTranslator: customAssetWalletTranslator,
                });
                const resolvedAddress = cruxAddressResolver.resolveAddressByAssetGroup(assetGroup);
                expect(resolvedAddress).to.be.undefined;
            })
        })
    })
});
