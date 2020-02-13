import { CruxAssetTranslator} from "../application/services/crux-asset-translator";
import { expect } from 'chai';
import { IGlobalAssetList, IClientAssetMapping } from "../core/entities/crux-domain";
describe('Application Services Tests', () => {
    describe('Testing AssetTranslator', () => {
        const testClientAssetList: IGlobalAssetList = [
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
            },
            {
                "assetId": "5ed4d7ac-f741-4af0-bca9-3c02acd00beb",
                "symbol": "DASH",
                "name": "Dash",
                "assetType": null,
                "decimals": 8,
                "assetIdentifierName": null,
                "assetIdentifierValue": null,
                "parentAssetId": null
            },
            {
                "assetId": "d4b874c4-7cf7-456f-8225-eb20e33767f2",
                "symbol": "XMR",
                "name": "Monero",
                "assetType": null,
                "decimals": 8,
                "assetIdentifierName": null,
                "assetIdentifierValue": null,
                "parentAssetId": null
            },
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
        it('Translate symbolAddressMap to assetIdAddressMap', ()=>{
            const assetIdAddressMap = cruxAssetTranslator.symbolAddressMapToAssetIdAddressMap(testUserUpperCaseCurrencyAddressMap);
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
                "eth": {
                    "assetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a",
                    "symbol": "ETH",
                    "name": "Ethereum",
                    "assetType": null,
                    "decimals": 8,
                    "assetIdentifierName": null,
                    "assetIdentifierValue": null,
                    "parentAssetId": null
                },
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
                },
                "dash": {
                    "assetId": "5ed4d7ac-f741-4af0-bca9-3c02acd00beb",
                    "symbol": "DASH",
                    "name": "Dash",
                    "assetType": null,
                    "decimals": 8,
                    "assetIdentifierName": null,
                    "assetIdentifierValue": null,
                    "parentAssetId": null
                },
                "xmr": {
                    "assetId": "d4b874c4-7cf7-456f-8225-eb20e33767f2",
                    "symbol": "XMR",
                    "name": "Monero",
                    "assetType": null,
                    "decimals": 8,
                    "assetIdentifierName": null,
                    "assetIdentifierValue": null,
                    "parentAssetId": null
                },
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
});
