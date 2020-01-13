import { CruxAssetTranslator, IClientAssetMapping, IGlobalAssetList } from "../application/services/crux-asset-translator";
import { expect } from 'chai';
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
            }
        ]
        const testClientAssetMapping: IClientAssetMapping = {
            "XTZ": "b0115257-13f2-4fb1-8796-07becdcacf8f",
            "TRX": "ab212c90-a2ab-48cf-873c-a7b6e97d8935",
            "BNB": "d88f558a-7a0e-4cd4-8629-07e5f7326a3c",
            "XEM": "7333c9c9-976a-4045-b6fa-176ac13ddf6d",
            "XLM": "b8edc3ba-6606-4a63-b8f6-58b491c2e40a",
            "KIN": "39c343cb-65a9-4d58-9f59-f32f99441661",
            "XRP": "abe0030a-d8e3-4518-879f-cd9939b7d8ab",
            "ONT": "af9c0656-580e-4700-bec8-13d24d2ead87",
            "IOST": "aa6a5fa4-c7c2-43b6-9f57-95329d1ce339",
            "ATOM": "9ba604b1-c9ae-4600-aad4-e3a7c2903388",
            "NEO": "aae85fa5-7d6a-427c-8088-37df459d55b8",
            "NANO": "e4f66cbc-c2ef-4462-8226-c944936804ff",
            "XMR": "d4b874c4-7cf7-456f-8225-eb20e33767f2",
            "ADA": "c72972bd-7e85-40b4-83e5-9634f827214e",
            "LSK": "a9b1c316-298b-4615-9e13-5408e6ff9043",
            "WAVES": "948f056c-d1f7-418f-b0c1-e449cd8ad215",
            "EOS": "948a4b55-be93-4caa-ab6e-9b2076a0a958",
            "ETH": "4e4d9982-3469-421b-ab60-2c0c2f05386a",
            "ETC": "b38a1576-a704-479b-96fa-b9a83bda7ed5",
            "BTC": "d78c26f8-7c13-4909-bf62-57d7623f8ee8",
            "ZEN": "200de082-92d0-4473-892c-85feddc999c7",
            "BCH": "aa841d73-3105-485d-9af9-870bc42d6284",
            "BSV": "bf8d2a6f-0628-4d39-b7d0-2b32a20d556f",
            "BTG": "578b7fa7-f12f-4503-b0ff-cc66ed1bc0df",
            "ANON": "142e9a63-26fb-45cf-83e6-3f08417cd089",
            "ZEC": "65705c19-c6d5-445e-8235-29a0da22ee89",
            "ZCL": "0cd4eda8-f694-4187-8848-28b18a6880ad",
            "KMD": "3d247a88-fb3d-43e1-95d3-b4cf67d20b16",
            "DGB": "97c3dc32-c042-475c-b173-008289c772f7",
            "LTC": "d79b9ece-a918-4523-b2bc-74071675b54a",
            "DASH": "5ed4d7ac-f741-4af0-bca9-3c02acd00beb",
            "BTCP": "6a980721-ec24-4248-b3be-2fb49202be87",
            "BTX": "cced16b1-4326-42e2-a5dd-bf9cae4d3517",
            "BZX": "7f41fa08-a858-439e-a69d-56a767aba929",
            "GRS": "600a73a1-2894-47e2-9167-fc2d0f7a06b3",
            "XZC": "90ea7839-016f-4cd0-b88c-2c738f7740e4",
            "DOGE": "0a2f3bb6-5190-4c02-85a9-5eecea9ed912",
            "QTUM": "dfb13a51-6bf7-48df-8db8-84021d70e6b0",
            "VET": "b3e4cc24-5af1-4ed3-b989-15a79f0282de",
            "DCR": "78466ff1-5a36-4210-9a26-dc8585f75b1e",
            "RVN": "a08cecb9-8e5d-415e-83f0-184be79f68ba"
        }
        let cruxAssetTranslator: CruxAssetTranslator = new CruxAssetTranslator(testClientAssetMapping);
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
});
