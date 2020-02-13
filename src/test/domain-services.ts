// describe('Testing CruxAddressResolver', () => {
//     const testEthAddress = {
//         addressHash: "0x0a2311594059b468c9897338b027c8782398b481",
//     }
//     const testOmgAddress = {
//         addressHash: "0xd26114cd6ee289accf82350c8d8487fedb8a0c07",
//     }
//     const customAssetWalletUser = new CruxUser(
//         CruxId.fromString("user@custom_asset_wallet.crux"),
//         {
//             "4e4d9982-3469-421b-ab60-2c0c2f05386a": testEthAddress,
//             "1c70b1cd-0bc2-4ea4-a3d2-c031fcdd04e5": testOmgAddress,
//         },
//         {
//             registrationStatus: {
//                 status: SubdomainRegistrationStatus.DONE,
//                 statusDetail: SubdomainRegistrationStatusDetail.DONE,
//             }
//         },
//         {
//             configuration: {
//                 enabledParentAssetFallbacks: ["ERC20_4e4d9982-3469-421b-ab60-2c0c2f05386a"],
//             }
//         }
//     );
//     const strictAssetWalletUser = new CruxUser(
//         CruxId.fromString("user@strict_asset_wallet.crux"),
//         {
//             "4e4d9982-3469-421b-ab60-2c0c2f05386a": testEthAddress,
//         },
//         {
//             registrationStatus: {
//                 status: SubdomainRegistrationStatus.DONE,
//                 statusDetail: SubdomainRegistrationStatusDetail.DONE,
//             }
//         },
//         {
//             configuration: {
//                 enabledParentAssetFallbacks: [],
//             }
//         }
//     )
//     const strictAssetWalletTranslator = new CruxAssetTranslator(
//         {
//             "eth": "4e4d9982-3469-421b-ab60-2c0c2f05386a",
//             "zrx": "ed919ad4-c0d0-42a7-a2b3-9728cbb81f26",
//         },
//         [
//             {
//                 "assetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a",
//                 "symbol": "ETH",
//                 "name": "Ethereum",
//                 "assetType": null,
//                 "decimals": 8,
//                 "assetIdentifierName": null,
//                 "assetIdentifierValue": null,
//                 "parentAssetId": null
//             },
//             {
//                 "assetId": "ed919ad4-c0d0-42a7-a2b3-9728cbb81f26",
//                 "symbol": "ZRX",
//                 "name": "0x Protocol Token",
//                 "assetType": "ERC20",
//                 "decimals": 18,
//                 "assetIdentifierName": "Contract Address",
//                 "assetIdentifierValue": "0xE41d2489571d322189246DaFA5ebDe1F4699F498",
//                 "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
//             }
//         ]
//     )
//     const customAssetWalletTranslator = new CruxAssetTranslator(
//         {
//             "eth": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
//         },
//         [
//             {
//                 "assetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a",
//                 "symbol": "ETH",
//                 "name": "Ethereum",
//                 "assetType": null,
//                 "decimals": 8,
//                 "assetIdentifierName": null,
//                 "assetIdentifierValue": null,
//                 "parentAssetId": null
//             },
//             {
//                 "assetId": "ed919ad4-c0d0-42a7-a2b3-9728cbb81f26",
//                 "symbol": "ZRX",
//                 "name": "0x Protocol Token",
//                 "assetType": "ERC20",
//                 "decimals": 18,
//                 "assetIdentifierName": "Contract Address",
//                 "assetIdentifierValue": "0xE41d2489571d322189246DaFA5ebDe1F4699F498",
//                 "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
//             },
//             {
//                 "assetId": "1c70b1cd-0bc2-4ea4-a3d2-c031fcdd04e5",
//                 "symbol": "OMG",
//                 "name": "OMGToken",
//                 "assetType": "ERC20",
//                 "decimals": 18,
//                 "assetIdentifierName": "Contract Address",
//                 "assetIdentifierValue": "0xd26114cd6EE289AccF82350c8d8487fedB8A0C07",
//                 "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
//             }
//         ]
//     )
//     it('resolveAddressBySymbol test', () => {
//         const walletCurrencySymbol = "zrx";
//         const cruxAddressResolver = new CruxAddressResolver({
//             cruxAssetTranslator: strictAssetWalletTranslator,
//             cruxUser: customAssetWalletUser,
//             userCruxAssetTranslator: customAssetWalletTranslator,
//         });
//         const resolvedAddress = cruxAddressResolver.resolveAddressBySymbol(walletCurrencySymbol);
//         expect(resolvedAddress).to.be.eql(testEthAddress);
//     })
//     describe('resolveAddressByAssetMatcher tests', () => {
//         it('sender resolving erc20 (address available with receiver)', () => {
//             const assetMatcher: IAssetMatcher = {
//                 assetGroup: "ERC20_eth",
//             };
//             const cruxAddressResolver = new CruxAddressResolver({
//                 cruxAssetTranslator: strictAssetWalletTranslator,
//                 cruxUser: customAssetWalletUser,
//                 userCruxAssetTranslator: customAssetWalletTranslator,
//             });
//             const resolvedAddress = cruxAddressResolver.resolveAddressByAssetMatcher(assetMatcher);
//             expect(resolvedAddress).to.be.eql(testEthAddress);
//         })
//         it('sender resolving using zrx contract address (without receiver asset information)', () => {
//             const assetMatcher: IAssetMatcher = {
//                 assetGroup: "ERC20_eth",
//                 assetIdentifierValue: "0xE41d2489571d322189246DaFA5ebDe1F4699F498",
//             };
//             const cruxAddressResolver = new CruxAddressResolver({
//                 cruxAssetTranslator: strictAssetWalletTranslator,
//                 cruxUser: customAssetWalletUser,
//             });
//             let raisedError;
//             try {
//                 const resolvedAddress = cruxAddressResolver.resolveAddressByAssetMatcher(assetMatcher);
//             } catch (error) {
//                 raisedError = error;
//             }
//             expect(raisedError).to.be.not.undefined;
//         })
//         it('sender resolving omg (asset available with receiver) with omg specific address', () => {
//             const assetMatcher: IAssetMatcher = {
//                 assetGroup: "ERC20_eth",
//                 assetIdentifierValue: "0xd26114cd6EE289AccF82350c8d8487fedB8A0C07",
//             };
//             const cruxAddressResolver = new CruxAddressResolver({
//                 cruxAssetTranslator: strictAssetWalletTranslator,
//                 cruxUser: customAssetWalletUser,
//                 userCruxAssetTranslator: customAssetWalletTranslator,
//             });
//             let raisedError;
//             const resolvedAddress = cruxAddressResolver.resolveAddressByAssetMatcher(assetMatcher);
//             expect(resolvedAddress).to.be.eql(testOmgAddress);
//         })
//         it('sender resolving zrx (asset & address available with receiver)', () => {
//             const assetMatcher: IAssetMatcher = {
//                 assetGroup: "ERC20_eth",
//                 assetIdentifierValue: "0xE41d2489571d322189246DaFA5ebDe1F4699F498",
//             };
//             const cruxAddressResolver = new CruxAddressResolver({
//                 cruxAssetTranslator: strictAssetWalletTranslator,
//                 cruxUser: customAssetWalletUser,
//                 userCruxAssetTranslator: customAssetWalletTranslator,
//             });
//             const resolvedAddress = cruxAddressResolver.resolveAddressByAssetMatcher(assetMatcher);
//             expect(resolvedAddress).to.be.eql(testEthAddress);
//         })
//         it('sender resolving life (asset & address not available with receiver)', () => {
//             const assetMatcher: IAssetMatcher = {
//                 assetGroup: "ERC20_eth",
//                 assetIdentifierValue: "0xff18dbc487b4c2e3222d115952babfda8ba52f5f",
//             };
//             const cruxAddressResolver = new CruxAddressResolver({
//                 cruxAssetTranslator: strictAssetWalletTranslator,
//                 cruxUser: customAssetWalletUser,
//                 userCruxAssetTranslator: customAssetWalletTranslator,
//             });
//             const resolvedAddress = cruxAddressResolver.resolveAddressByAssetMatcher(assetMatcher);
//             expect(resolvedAddress).to.be.eql(testEthAddress);
//         })
//         it('sender resolving rbtc_erc20 (asset & addres not available with receiver)', () => {
//             const assetMatcher: IAssetMatcher = {
//                 assetGroup: "ERC20_rbtc",
//             };
//             const cruxAddressResolver = new CruxAddressResolver({
//                 cruxAssetTranslator: strictAssetWalletTranslator,
//                 cruxUser: customAssetWalletUser,
//                 userCruxAssetTranslator: customAssetWalletTranslator,
//             });
//             let raisedError;
//             try {
//                 const resolvedAddress = cruxAddressResolver.resolveAddressByAssetMatcher(assetMatcher);
//             } catch (error) {
//                 raisedError = error;
//             }
//             expect(raisedError).to.be.not.undefined;
//             expect(raisedError).to.be.instanceOf(PackageError);
//             expect(raisedError["errorCode"]).to.be.equal(PackageErrorCode.AddressNotAvailable);
//         })
//     })
//     it('resolveAddressWithAssetId test', () => {
//         const assetId = "ed919ad4-c0d0-42a7-a2b3-9728cbb81f26";
//         const cruxAddressResolver = new CruxAddressResolver({
//             cruxAssetTranslator: strictAssetWalletTranslator,
//             cruxUser: customAssetWalletUser,
//             userCruxAssetTranslator: customAssetWalletTranslator,
//         });
//         const resolvedAddress = cruxAddressResolver.resolveAddressWithAssetId(assetId);
//         expect(resolvedAddress).to.be.eql(testEthAddress);
//     })
//     describe('resolveAddressByAssetGroup tests', () => {
//         it('sender resolving erc20 address (receiver has the fallback enabled)', () => {
//             const assetGroup = "ERC20_eth";
//             const cruxAddressResolver = new CruxAddressResolver({
//                 cruxAssetTranslator: strictAssetWalletTranslator,
//                 cruxUser: customAssetWalletUser,
//                 userCruxAssetTranslator: customAssetWalletTranslator,
//             });
//             const resolvedAddress = cruxAddressResolver.resolveAddressByAssetGroup(assetGroup);
//             expect(resolvedAddress).to.be.eql(testEthAddress);
//         })
//         it('sender resolving erc20 address (receiver has the fallback disabled)', () => {
//             const assetGroup = "ERC20_eth";
//             const cruxAddressResolver = new CruxAddressResolver({
//                 cruxAssetTranslator: strictAssetWalletTranslator,
//                 cruxUser: strictAssetWalletUser,
//                 userCruxAssetTranslator: customAssetWalletTranslator,
//             });
//             const resolvedAddress = cruxAddressResolver.resolveAddressByAssetGroup(assetGroup);
//             expect(resolvedAddress).to.be.undefined;
//         })
//     })
// })