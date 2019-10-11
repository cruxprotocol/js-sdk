
import { CruxClient } from "../index";
import { BlockstackService } from '../packages/name-service/blockstack-service';
import * as nameservice from "../packages/name-service/blockstack-service";
import { GaiaService } from "../packages/gaia-service";
import { getContentFromGaiaHub as getFileFromGaia } from "../packages/gaia-service/utils";


declare global {
  interface Window {
      wallet: CruxClient;
      blockstackservice: BlockstackService;
      gaiaService: GaiaService;
      addPayIDClaim: Function;
      putClientCurrencyMapping: Function;
      getContentFromGaiaHub: Function;
      uploadGlobalAssetList: Function;
      _uploadProfileInfo: Function;
  }
}

window.blockstackservice = new BlockstackService();
window.gaiaService = new GaiaService("cruxdev");

window.wallet = new CruxClient({walletClientName: "devcoinswitch", getEncryptionKey: () => "fookey"});

const putClientCurrencyMapping = async () => {
    console.log("putClientCurrencyMapping called...")
    let clientConfig = {
      "assetMapping": {
        "XRP": "abe0030a-d8e3-4518-879f-cd9939b7d8ab",
        "EOS": "948a4b55-be93-4caa-ab6e-9b2076a0a958",
        "ETH": "4e4d9982-3469-421b-ab60-2c0c2f05386a",
        "TRX": "ab212c90-a2ab-48cf-873c-a7b6e97d8935",
        "BTC": "d78c26f8-7c13-4909-bf62-57d7623f8ee8"
      },
      "nameserviceConfiguration": {
        "domain": "cruxdev",
        "subdomainRegistrar": "https://cruxdev-registrar.cruxpay.com/"
      },
      "assetList": [
        {
          "assetId": "b7683297-2194-4ce5-93ac-ac881f84b04f",
          "symbol": "ARK",
          "name": "Ark",
          "assetType": null,
          "decimals": 8,
          "assetIdentifierName": null,
          "assetIdentifierValue": null,
          "parentAssetId": null
        },
        {
          "assetId": "eaa860f3-cd65-407f-bc43-591393293f20",
          "symbol": "AST",
          "name": "AirSwap Token",
          "assetType": "ERC20",
          "decimals": 4,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x27054b13b1B798B345b591a4d22e6562d47eA75a",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "5d07ccc2-a9de-495a-a981-cd7394c7deee",
          "symbol": "APPC",
          "name": "AppCoins",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x1a7a8bd9106f2b8d977e08582dc7d24c723ab0db",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "e1423643-722d-4b3d-b3bc-472c237b9e84",
          "symbol": "ANT",
          "name": "Aragon Network Token",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x960b236A07cf122663c4303350609A66A7B288C0",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "19bd1501-9a8e-4500-9a93-129f9c23d31d",
          "symbol": "REP",
          "name": "Reputation",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x1985365e9f78359a9B6AD760e32412f4a445E862",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "65023c5f-8cf6-448c-bc00-498a64e85ba2",
          "symbol": "BNT",
          "name": "Bancor Network Token",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "0ae676cf-68b7-42ba-b54f-2672afd4f921",
          "symbol": "BAT",
          "name": "Basic Attention Token",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x0D8775F648430679A709E98d2b0Cb6250d2887EF",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
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
          "assetId": "d78c26f8-7c13-4909-bf62-57d7623f8ee8",
          "symbol": "BTC",
          "name": "Bitcoin",
          "assetType": null,
          "decimals": 8,
          "assetIdentifierName": null,
          "assetIdentifierValue": null,
          "parentAssetId": null
        },
        {
          "assetId": "aa841d73-3105-485d-9af9-870bc42d6284",
          "symbol": "BCH",
          "name": "Bitcoin Cash",
          "assetType": null,
          "decimals": 8,
          "assetIdentifierName": null,
          "assetIdentifierValue": null,
          "parentAssetId": null
        },
        {
          "assetId": "bf8d2a6f-0628-4d39-b7d0-2b32a20d556f",
          "symbol": "BSV",
          "name": "Bitcoin SV",
          "assetType": null,
          "decimals": 8,
          "assetIdentifierName": null,
          "assetIdentifierValue": null,
          "parentAssetId": null
        },
        {
          "assetId": "578b7fa7-f12f-4503-b0ff-cc66ed1bc0df",
          "symbol": "BTG",
          "name": "Bitcoin Gold",
          "assetType": null,
          "decimals": 8,
          "assetIdentifierName": null,
          "assetIdentifierValue": null,
          "parentAssetId": null
        },
        {
          "assetId": "11d2d19d-bfea-4abf-a52d-4600982f47a6",
          "symbol": "BTT",
          "name": "BitTorrent",
          "assetType": "TRC10",
          "decimals": 6,
          "assetIdentifierName": "Asset ID",
          "assetIdentifierValue": "1002000",
          "parentAssetId": "ab212c90-a2ab-48cf-873c-a7b6e97d8935"
        },
        {
          "assetId": "c72972bd-7e85-40b4-83e5-9634f827214e",
          "symbol": "ADA",
          "name": "Cardano",
          "assetType": null,
          "decimals": 5,
          "assetIdentifierName": null,
          "assetIdentifierValue": null,
          "parentAssetId": null
        },
        {
          "assetId": "ac9895e5-ea39-4483-a614-00462f04e986",
          "symbol": "LINK",
          "name": "ChainLink Token",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x514910771af9ca656af840dff83e8264ecf986ca",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "a6d02462-e1b0-4135-bb64-49e567217a5f",
          "symbol": "CVC",
          "name": "Civic",
          "assetType": "ERC20",
          "decimals": 8,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x41e5560054824ea6b0732e656e3ad64e20e94e45",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "f653b133-c106-41d1-b821-5ad4fc84e05e",
          "symbol": "CND",
          "name": "Cindicator Token",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0xd4c435f5b09f855c3317c8524cb1f586e42795fa",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "9ba604b1-c9ae-4600-aad4-e3a7c2903388",
          "symbol": "ATOM",
          "name": "Cosmos",
          "assetType": null,
          "decimals": 6,
          "assetIdentifierName": null,
          "assetIdentifierValue": null,
          "parentAssetId": null
        },
        {
          "assetId": "7d965a5c-9268-417a-972a-7b62fd690fad",
          "symbol": "DAI",
          "name": "DAI",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359",
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
          "assetId": "0f484fe3-e603-4508-93ac-d048ac9a552d",
          "symbol": "MANA",
          "name": "Decentraland",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x0F5D2fB29fb7d3CFeE444a200298f468908cC942",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "78466ff1-5a36-4210-9a26-dc8585f75b1e",
          "symbol": "DCR",
          "name": "Decred",
          "assetType": null,
          "decimals": 8,
          "assetIdentifierName": null,
          "assetIdentifierValue": null,
          "parentAssetId": null
        },
        {
          "assetId": "97c3dc32-c042-475c-b173-008289c772f7",
          "symbol": "DGB",
          "name": "DigiByte",
          "assetType": null,
          "decimals": 8,
          "assetIdentifierName": null,
          "assetIdentifierValue": null,
          "parentAssetId": null
        },
        {
          "assetId": "cfa80d98-11b9-47b9-b928-7e8323295820",
          "symbol": "DGD",
          "name": "Digix",
          "assetType": "ERC20",
          "decimals": 9,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0xE0B7927c4aF23765Cb51314A0E0521A9645F0E2A",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "e9e1f0f5-cc4e-4369-ab01-8477e7b971e5",
          "symbol": "DNT",
          "name": "district0x Network Token",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x0abdace70d3790235af448c88547603b945604ea",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "0a2f3bb6-5190-4c02-85a9-5eecea9ed912",
          "symbol": "DOGE",
          "name": "Dogecoin",
          "assetType": null,
          "decimals": 8,
          "assetIdentifierName": null,
          "assetIdentifierValue": null,
          "parentAssetId": null
        },
        {
          "assetId": "948a4b55-be93-4caa-ab6e-9b2076a0a958",
          "symbol": "EOS",
          "name": "EOS",
          "assetType": null,
          "decimals": 4,
          "assetIdentifierName": null,
          "assetIdentifierValue": null,
          "parentAssetId": null
        },
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
          "assetId": "b38a1576-a704-479b-96fa-b9a83bda7ed5",
          "symbol": "ETC",
          "name": "Ethereum Classic",
          "assetType": null,
          "decimals": 8,
          "assetIdentifierName": null,
          "assetIdentifierValue": null,
          "parentAssetId": null
        },
        {
          "assetId": "d7cf1afe-47f0-458a-9a5a-eea031ad2e05",
          "symbol": "ETHOS",
          "name": "Ethos",
          "assetType": "ERC20",
          "decimals": 8,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x5Af2Be193a6ABCa9c8817001F45744777Db30756",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "8b9f7abb-a364-4996-9819-3c45272fe95e",
          "symbol": "GAS",
          "name": "GAS",
          "assetType": "NEOUtilityToken",
          "decimals": 18,
          "assetIdentifierName": "Asset ID",
          "assetIdentifierValue": "602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7",
          "parentAssetId": "aae85fa5-7d6a-427c-8088-37df459d55b8"
        },
        {
          "assetId": "8118483c-1484-4223-85c9-6d1632ba610b",
          "symbol": "GUSD",
          "name": "Gemini Dollar",
          "assetType": "ERC20",
          "decimals": 2,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "85508230-6a6c-4c39-a256-4f25bd44d898",
          "symbol": "GNO",
          "name": "Gnosis Token",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x6810e776880C02933D47DB1b9fc05908e5386b96",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "d74d3574-0e02-47f8-945d-d5da3da24c05",
          "symbol": "GNT",
          "name": "Golem Network Token",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0xa74476443119A942dE498590Fe1f2454d7D4aC0d",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "03d284a9-6896-4f9b-9ce4-b5f6dba5600d",
          "symbol": "FUN",
          "name": "FunFair",
          "assetType": "ERC20",
          "decimals": 8,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x419D0d8BdD9aF5e606Ae2232ed285Aff190E711b",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "b14a6498-de43-4115-81a6-4a88660508f4",
          "symbol": "RLC",
          "name": "iEx.ec Network Token",
          "assetType": "ERC20",
          "decimals": 9,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x607F4C5BB672230e8672085532f7e901544a7375",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "a9b1c316-298b-4615-9e13-5408e6ff9043",
          "symbol": "LSK",
          "name": "Lisk",
          "assetType": null,
          "decimals": 8,
          "assetIdentifierName": null,
          "assetIdentifierValue": null,
          "parentAssetId": null
        },
        {
          "assetId": "d79b9ece-a918-4523-b2bc-74071675b54a",
          "symbol": "LTC",
          "name": "Litecoin",
          "assetType": null,
          "decimals": 8,
          "assetIdentifierName": null,
          "assetIdentifierValue": null,
          "parentAssetId": null
        },
        {
          "assetId": "8380065d-4c64-4736-a3e0-841c205ee6d7",
          "symbol": "LUN",
          "name": "Lunyr Token",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0xfa05A73FfE78ef8f1a739473e462c54bae6567D9",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "48826f18-c591-46ec-bd05-03c97bec3f15",
          "symbol": "LOOM",
          "name": "LoomToken",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0xa4e8c3ec456107ea67d3075bf9e3df3a75823db0",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "ec93bb71-0bb5-4412-af66-8c905d73033d",
          "symbol": "MKR",
          "name": "Maker",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "7d443286-3ed9-424d-a296-87a4616aa692",
          "symbol": "MCO",
          "name": "Monaco",
          "assetType": "ERC20",
          "decimals": 8,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0xB63B606Ac810a52cCa15e44bB630fd42D8d1d83d",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
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
        {
          "assetId": "e4f66cbc-c2ef-4462-8226-c944936804ff",
          "symbol": "NANO",
          "name": "Nano",
          "assetType": null,
          "decimals": 8,
          "assetIdentifierName": null,
          "assetIdentifierValue": null,
          "parentAssetId": null
        },
        {
          "assetId": "aae85fa5-7d6a-427c-8088-37df459d55b8",
          "symbol": "NEO",
          "name": "NEO",
          "assetType": "NEOGoverningToken",
          "decimals": 18,
          "assetIdentifierName": "Asset ID",
          "assetIdentifierValue": "c56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b",
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
          "assetId": "9dbafbf2-5974-4308-ae7d-eb2957dab8e0",
          "symbol": "NMR",
          "name": "Numeraire",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671",
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
        },
        {
          "assetId": "af9c0656-580e-4700-bec8-13d24d2ead87",
          "symbol": "ONT",
          "name": "Ontology",
          "assetType": null,
          "decimals": 1,
          "assetIdentifierName": null,
          "assetIdentifierValue": null,
          "parentAssetId": null
        },
        {
          "assetId": "14a75048-0658-44c9-9501-d7a290358835",
          "symbol": "ONG",
          "name": "Ontology Gas",
          "assetType": null,
          "decimals": 9,
          "assetIdentifierName": null,
          "assetIdentifierValue": null,
          "parentAssetId": null
        },
        {
          "assetId": "87330131-52aa-46c7-8700-1cd7d6c25501",
          "symbol": "PAX",
          "name": "PAX",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x8e870d67f660d95d5be530380d0ec0bd388289e1",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "a7c58707-15dc-45ae-ac28-775c5eb6be73",
          "symbol": "POE",
          "name": "Po.et",
          "assetType": "ERC20",
          "decimals": 8,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x0e0989b1f9b8a38983c2ba8053269ca62ec9b195",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "002d16b6-8393-4369-83f1-46d8d1f8939e",
          "symbol": "POLY",
          "name": "Polymath",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x9992eC3cF6A55b00978cdDF2b27BC6882d88D1eC",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "669c5f7e-f3da-4fd6-87e2-039f9f6281d8",
          "symbol": "PPT",
          "name": "Populous Platform",
          "assetType": "ERC20",
          "decimals": 8,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0xd4fa1460F537bb9085d22C7bcCB5DD450Ef28e3a",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "1103e34a-6955-4d16-8b5c-91b9ea54c229",
          "symbol": "POWR",
          "name": "Power Ledger",
          "assetType": "ERC20",
          "decimals": 6,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x595832f8fc6bf59c85c527fec3740a1b7a361269",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "16e3dbc3-4db5-4593-8cb3-4f0a12b99aad",
          "symbol": "QSP",
          "name": "Quantstamp Token",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x99ea4dB9EE77ACD40B119BD1dC4E33e1C070b80d",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "dfb13a51-6bf7-48df-8db8-84021d70e6b0",
          "symbol": "QTUM",
          "name": "Qtum",
          "assetType": null,
          "decimals": 8,
          "assetIdentifierName": null,
          "assetIdentifierValue": null,
          "parentAssetId": null
        },
        {
          "assetId": "a08cecb9-8e5d-415e-83f0-184be79f68ba",
          "symbol": "RVN",
          "name": "Ravencoin",
          "assetType": null,
          "decimals": 8,
          "assetIdentifierName": null,
          "assetIdentifierValue": null,
          "parentAssetId": null
        },
        {
          "assetId": "abe0030a-d8e3-4518-879f-cd9939b7d8ab",
          "symbol": "XRP",
          "name": "Ripple",
          "assetType": null,
          "decimals": 6,
          "assetIdentifierName": null,
          "assetIdentifierValue": null,
          "parentAssetId": null
        },
        {
          "assetId": "29ba5109-4e56-4946-9c0a-03261d1573eb",
          "symbol": "RCN",
          "name": "Ripio Credit Network Token",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0xf970b8e36e23f7fc3fd752eea86f8be8d83375a6",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "2bb2b950-9583-4d54-b3f6-1ff5b8e076df",
          "symbol": "SNT",
          "name": "Status Network",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x744d70FDBE2Ba4CF95131626614a1763DF805B9E",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "b8edc3ba-6606-4a63-b8f6-58b491c2e40a",
          "symbol": "XLM",
          "name": "Stellar Lumens",
          "assetType": null,
          "decimals": 7,
          "assetIdentifierName": null,
          "assetIdentifierValue": null,
          "parentAssetId": null
        },
        {
          "assetId": "619bd3ce-b74e-4c05-91a9-a4ea7a771a76",
          "symbol": "STORJ",
          "name": "StorjToken",
          "assetType": "ERC20",
          "decimals": 8,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0xB64ef51C888972c908CFacf59B47C1AfBC0Ab8aC",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "17ec53b2-741c-448a-b3b1-b3c082c58cd2",
          "symbol": "STORM",
          "name": "Storm Token",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0xD0a4b8946Cb52f0661273bfbC6fD0E0C75Fc6433",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "73b1618a-d61f-4dd4-87c3-853a967d4490",
          "symbol": "PAY",
          "name": "TenX Pay Token",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0xB97048628DB6B661D4C2aA833e95Dbe1A905B280",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "5e414e43-e6fe-4de0-8fc7-8e56282cf90f",
          "symbol": "USDT",
          "name": "Tether USD",
          "assetType": "ERC20",
          "decimals": 6,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0xdac17f958d2ee523a2206206994597c13d831ec7",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
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
          "assetId": "29cb1dc7-37b1-427a-89b3-98734fc1311b",
          "symbol": "TUSD",
          "name": "TrueUSD",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x0000000000085d4780B73119b644AE5ecd22b376",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "23fab390-e6cb-4676-a5f1-e1c5317366e5",
          "symbol": "USDC",
          "name": "USD Coin",
          "assetType": "ERC20",
          "decimals": 6,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "b3e4cc24-5af1-4ed3-b989-15a79f0282de",
          "symbol": "VET",
          "name": "VeChain",
          "assetType": null,
          "decimals": 18,
          "assetIdentifierName": null,
          "assetIdentifierValue": null,
          "parentAssetId": null
        },
        {
          "assetId": "b3e4cc24-5af1-4ed3-b989-15a79f0282de",
          "symbol": "VTHO",
          "name": "VeThor",
          "assetType": "VIP180",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x0000000000000000000000000000456E65726779",
          "parentAssetId": "b3e4cc24-5af1-4ed3-b989-15a79f0282de"
        },
        {
          "assetId": "4afe61e1-7209-4a87-9f2a-b2a73ebc9b93",
          "symbol": "VIB",
          "name": "Viberate",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0x2C974B2d0BA1716E644c1FC59982a89DDD2fF724",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        },
        {
          "assetId": "948f056c-d1f7-418f-b0c1-e449cd8ad215",
          "symbol": "WAVES",
          "name": "Waves",
          "assetType": null,
          "decimals": 8,
          "assetIdentifierName": null,
          "assetIdentifierValue": null,
          "parentAssetId": null
        },
        {
          "assetId": "65705c19-c6d5-445e-8235-29a0da22ee89",
          "symbol": "ZEC",
          "name": "Zcash",
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
          "assetId": "03f09588-239c-4e54-98b2-19f7649fb692",
          "symbol": "BNB",
          "name": "BNB",
          "assetType": "ERC20",
          "decimals": 18,
          "assetIdentifierName": "Contract Address",
          "assetIdentifierValue": "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
          "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
        }
      ]}
    let response = await window.gaiaService.uploadContentToGaiaHub(nameservice.UPLOADABLE_JSON_FILES.CLIENT_CONFIG, '5df487385864006417bd6a77c3f53626985919f9fb4b7cb8878eaf555dee4163', clientConfig);
    console.log(`content upload response is:- ${response}`)
}

const getContentFromGaiaHub = async () => {
    console.log("getContentFromGaiaHub called...")
    let name = ''
    let response = await getFileFromGaia(name, nameservice.UPLOADABLE_JSON_FILES.CLIENT_MAPPING);
    console.log(`content upload response is:- ${response}`)
}

const uploadGlobalAssetList = async () => {
    let identityClaim = {}
    let content = [
        {
          "asset_id": "8dd939ef-b9d2-46f0-8796-4bd8dbaeef1b",
          "name": "Litecoin",
          "symbol": "ltc",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/litecoin.png"
        },
        {
          "asset_id": "508b8f73-4b06-453e-8151-78cb8cfc3bc9",
          "name": "Ethereum",
          "symbol": "eth",
          "image_sm_url": "https://files.coinswitch.co/public/coins/eth.png"
        },
        {
          "asset_id": "9a267cc3-0e72-4db5-930c-c60a74d64c55",
          "name": "Basic Attention Token",
          "symbol": "bat",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/bat.png"
        },
        {
          "asset_id": "490f7648-7fc1-4f0d-aa23-e08185daf8a5",
          "name": "DigiByte",
          "symbol": "dgb",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/digibyte.png"
        },
        {
          "asset_id": "77a880a0-3443-4eef-8500-bdc8dcdd3370",
          "name": "Dai",
          "symbol": "dai",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/dai.png"
        },
        {
          "asset_id": "902d4bde-f877-486e-813e-135920cc7f33",
          "name": "0x",
          "symbol": "zrx",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins/0x.png"
        },
        {
          "asset_id": "0999c959-f691-4553-b461-b88ea5032e0c",
          "name": "Monaco",
          "symbol": "mco",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/monaco.png"
        },
        {
          "asset_id": "fecfeb26-e612-4df4-aed7-bd4ad0194936",
          "name": "Civic",
          "symbol": "cvc",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/civic.png"
        },
        {
          "asset_id": "20d57d7d-3cc1-428a-ae90-09fb9c5168f5",
          "name": "Decred",
          "symbol": "dcr",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/decred.png"
        },
        {
          "asset_id": "9d796569-0faf-4e4a-b581-676fab3433d9",
          "name": "DigixDAO",
          "symbol": "dgd",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/digixdao.png"
        },
        {
          "asset_id": "d133dd13-a791-4c2b-9c14-b4c8532f6b91",
          "name": "district0x",
          "symbol": "dnt",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/district0x.png"
        },
        {
          "asset_id": "9dbdc727-de68-4f2a-8956-04a38ed71ca5",
          "name": "Tron",
          "symbol": "trx",
          "image_sm_url": "https://files.coinswitch.co/public/coins/trx.png"
        },
        {
          "asset_id": "9dbdc727-de68-4f2a-8956-04a38ed71ca6",
          "name": "EOS",
          "symbol": "eos",
          "image_sm_url": "https://files.coinswitch.co/public/coins/eos.png"
        },
        {
          "asset_id": "1d6e1a99-1e77-41e1-9ebb-0e216faa166a",
          "name": "Bitcoin",
          "symbol": "btc",
          "image_sm_url": "https://files.coinswitch.co/public/coins/btc.png"
        },
        {
          "asset_id": "b33adc7a-beb9-421f-95d6-d495dc549f79",
          "name": "Lisk",
          "symbol": "lsk",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/lisk_v2.png"
        },
        {
          "asset_id": "3e92f1b6-693c-4654-9b9b-938582d64e4f",
          "name": "Waves",
          "symbol": "waves",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/waves.png"
        },
        {
          "asset_id": "2794e4c6-6bec-45da-b4a6-74996cdad79a",
          "name": "Golem",
          "symbol": "gnt",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/golem.png"
        },
        {
          "asset_id": "86a3f3fa-d616-4f40-b46c-09c49c0187e1",
          "name": "OmiseGO",
          "symbol": "omg",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/omisego.png"
        },
        {
          "asset_id": "8960c3e7-c953-4db1-8497-34b82d9ce322",
          "name": "Augur",
          "symbol": "rep",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/augur.png"
        }
      ]
    let response = await window.blockstackservice.uploadContentToGaiaHub(UPLOADABLE_JSON_FILES.ASSET_LIST, '', content);
    console.log(`content upload response is:- ${response}`)
}


const addPayIDClaim = async () => {
    // await window.wallet.addPayIDClaim("", "", null)
}

const _uploadProfileInfo = async() => {
  let privateKey = ""
  // let res = await window.blockstackservice._uploadProfileInfo(privateKey);

  // console.log(`_uploadProfileInfo status:- ${res}`)
}

window.addPayIDClaim = addPayIDClaim
window.putClientCurrencyMapping = putClientCurrencyMapping
window.getContentFromGaiaHub = getContentFromGaiaHub
window.uploadGlobalAssetList = uploadGlobalAssetList
window._uploadProfileInfo = _uploadProfileInfo