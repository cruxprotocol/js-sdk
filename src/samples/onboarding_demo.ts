import { IBlockstackServiceInputOptions, ManualKeyManager, ICruxOnBoardingClientOptions, CruxOnBoardingClient, DomainRegistrationStatus, CruxOnBoardingClientError, IClientAssetMapping, CruxSpec } from "../index";

const doc = (document as {
    getElementById: Function,
    getElementsByName: Function,
    getElementsByClassName: Function
})

// Demo wallet artifacts

const sampleAssetMappings = {
    "cruxdev": {
        "btc": "d78c26f8-7c13-4909-bf62-57d7623f8ee8",
        "eth": "4e4d9982-3469-421b-ab60-2c0c2f05386a",
        "xrp": "abe0030a-d8e3-4518-879f-cd9939b7d8ab",
        "trx": "ab212c90-a2ab-48cf-873c-a7b6e97d8935",
        "eos": "948a4b55-be93-4caa-ab6e-9b2076a0a958",
        "ltc": "d79b9ece-a918-4523-b2bc-74071675b54a",
        "life": "0fcdab6b-9ca8-48d9-9254-32b078a2b31e"
    },
    "testwallet1": {
        "bitcoin": "d78c26f8-7c13-4909-bf62-57d7623f8ee8",
        "ethereum": "4e4d9982-3469-421b-ab60-2c0c2f05386a",
        "ripple": "abe0030a-d8e3-4518-879f-cd9939b7d8ab",
        "tether": "c0a38c0b-f249-4d4b-a17d-d03a95e09fa6",
        "bitcoincash": "aa841d73-3105-485d-9af9-870bc42d6284",
        "litecoin": "d79b9ece-a918-4523-b2bc-74071675b54a",
        "eos": "948a4b55-be93-4caa-ab6e-9b2076a0a958",
        "binancecoin": "d88f558a-7a0e-4cd4-8629-07e5f7326a3c",
        "bitcoinsv": "bf8d2a6f-0628-4d39-b7d0-2b32a20d556f",
        "stellar": "b8edc3ba-6606-4a63-b8f6-58b491c2e40a"
    },
    "testwallet2": {
        "btc": "d78c26f8-7c13-4909-bf62-57d7623f8ee8",
        "eth": "4e4d9982-3469-421b-ab60-2c0c2f05386a",
        "xrp": "abe0030a-d8e3-4518-879f-cd9939b7d8ab",
        "usdt": "c0a38c0b-f249-4d4b-a17d-d03a95e09fa6",
        "bch": "aa841d73-3105-485d-9af9-870bc42d6284",
        "ltc": "d79b9ece-a918-4523-b2bc-74071675b54a",
        "eos": "948a4b55-be93-4caa-ab6e-9b2076a0a958",
        "bnb": "d88f558a-7a0e-4cd4-8629-07e5f7326a3c",
        "bsv": "bf8d2a6f-0628-4d39-b7d0-2b32a20d556f",
        "xlm": "b8edc3ba-6606-4a63-b8f6-58b491c2e40a"
    },
    "testwallet3": {
        "eth": "4e4d9982-3469-421b-ab60-2c0c2f05386a",
        "omg": "1c70b1cd-0bc2-4ea4-a3d2-c031fcdd04e5",
        "zil": "2f907203-347d-436e-8180-1684586f8826",
        "zrx": "ed919ad4-c0d0-42a7-a2b3-9728cbb81f26",
        "ae": "05098835-7b2c-4b5b-9f25-7b49b058bc97",
        "bat": "0ae676cf-68b7-42ba-b54f-2672afd4f921",
        "bnt": "65023c5f-8cf6-448c-bc00-498a64e85ba2",
        "fun": "03d284a9-6896-4f9b-9ce4-b5f6dba5600d",
        "gnt": "d74d3574-0e02-47f8-945d-d5da3da24c05",
        "knc": "5ff04c4e-ed84-4c56-b18b-c8c0a1de3e4e",
        "mkr": "ec93bb71-0bb5-4412-af66-8c905d73033d",
        "poe": "a7c58707-15dc-45ae-ac28-775c5eb6be73",
        "ppt": "669c5f7e-f3da-4fd6-87e2-039f9f6281d8",
        "rdn": "a250b8e7-4214-42d9-9567-2cbd4dad5b1a",
        "req": "01f9b537-d73a-48d2-acde-8b2639186bf3",
        "salt": "432ffb34-df15-42ac-ab92-0cf4aa66eb10",
        "snt": "2bb2b950-9583-4d54-b3f6-1ff5b8e076df",
        "storj": "619bd3ce-b74e-4c05-91a9-a4ea7a771a76",
        "cvc": "a6d02462-e1b0-4135-bb64-49e567217a5f",
        "dnt": "e9e1f0f5-cc4e-4369-ab01-8477e7b971e5",
        "plr": "129a9628-fda7-47d0-8b11-f6871b0fd03b",
        "edg": "352f1cca-d28d-41f9-8819-47cebe7c8f3a",
        "veri": "efd69854-7b54-4753-9f2a-2a0c79d6c819",
        "weth": "f21a6cce-ffeb-45ad-885f-efa0680cd231",
        "bnb": "7c3baa3c-f5e8-490a-88a1-e0a052b7caa4"
    }
}
const sampleSupportedParentAssetFallbacks = ["ERC20_4e4d9982-3469-421b-ab60-2c0c2f05386a"]
let sampleNameserviceConfig: IBlockstackServiceInputOptions;
const sampleAssetList = [
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
        "assetId": "0fcdab6b-9ca8-48d9-9254-32b078a2b31e",
        "symbol": "LIFE",
        "name": "PureLifeCoin",
        "assetType": "ERC20",
        "decimals": 18,
        "assetIdentifierName": "Contract Address",
        "assetIdentifierValue": "0xff18dbc487b4c2e3222d115952babfda8ba52f5f",
        "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
    },
    {
        "symbol": "USDT",
        "name": "Tether",
        "decimals": null,
        "assetIdentifierName": "Property ID",
        "assetIdentifierValue": 394,
        "parentAssetId": null,
        "assetType": "OMNI",
        "assetId": "c0a38c0b-f249-4d4b-a17d-d03a95e09fa6"
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
        "symbol": "ZIL",
        "name": "Zilliqa",
        "decimals": 12,
        "assetIdentifierName": "Contract Address",
        "assetIdentifierValue": "0x05f4a42e251f2d52b8ed15e9fedaacfcef1fad27",
        "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a",
        "assetType": "ERC20",
        "assetId": "2f907203-347d-436e-8180-1684586f8826"
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
        "symbol": "AE",
        "name": "Aeternity",
        "decimals": 18,
        "assetIdentifierName": "Contract Address",
        "assetIdentifierValue": "0x5ca9a71b1d01849c0a95490cc00559717fcf0d1d",
        "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a",
        "assetType": "ERC20",
        "assetId": "05098835-7b2c-4b5b-9f25-7b49b058bc97"
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
        "symbol": "KNC",
        "name": "Kyber",
        "decimals": 18,
        "assetIdentifierName": "Contract Address",
        "assetIdentifierValue": "0xdd974d5c2e2928dea5f71b9825b8b646686bd200",
        "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a",
        "assetType": "ERC20",
        "assetId": "5ff04c4e-ed84-4c56-b18b-c8c0a1de3e4e"
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
        "symbol": "RDN",
        "name": "Raiden Token",
        "decimals": 18,
        "assetIdentifierName": "Contract Address",
        "assetIdentifierValue": "0x255aa6df07540cb5d3d297f0d0d4d84cb52bc8e6",
        "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a",
        "assetType": "ERC20",
        "assetId": "a250b8e7-4214-42d9-9567-2cbd4dad5b1a"
    },
    {
        "symbol": "REQ",
        "name": "Request Network",
        "decimals": 18,
        "assetIdentifierName": "Contract Address",
        "assetIdentifierValue": "0x8f8221afbb33998d8584a2b05749ba73c37a938a",
        "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a",
        "assetType": "ERC20",
        "assetId": "01f9b537-d73a-48d2-acde-8b2639186bf3"
    },
    {
        "symbol": "SALT",
        "name": "SALT",
        "decimals": 8,
        "assetIdentifierName": "Contract Address",
        "assetIdentifierValue": "0x4156D3342D5c385a87D264F90653733592000581",
        "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a",
        "assetType": "ERC20",
        "assetId": "432ffb34-df15-42ac-ab92-0cf4aa66eb10"
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
        "assetId": "129a9628-fda7-47d0-8b11-f6871b0fd03b",
        "symbol": "PLR",
        "name": "PILLAR",
        "assetType": "ERC20",
        "decimals": 18,
        "assetIdentifierName": "Contract Address",
        "assetIdentifierValue": "0xe3818504c1b32bf1557b16c238b2e01fd3149c17",
        "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
    },
    {
        "assetId": "352f1cca-d28d-41f9-8819-47cebe7c8f3a",
        "symbol": "EDG",
        "name": "Edgeless",
        "assetType": "ERC20",
        "decimals": 0,
        "assetIdentifierName": "Contract Address",
        "assetIdentifierValue": "0x08711d3b02c8758f2fb3ab4e80228418a7f8e39c",
        "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
    },
    {
        "assetId": "efd69854-7b54-4753-9f2a-2a0c79d6c819",
        "symbol": "VERI",
        "name": "Veritaseum",
        "assetType": "ERC20",
        "decimals": 18,
        "assetIdentifierName": "Contract Address",
        "assetIdentifierValue": "0x8f3470A7388c05eE4e7AF3d01D8C722b0FF52374",
        "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
    },
    {
        "assetId": "f21a6cce-ffeb-45ad-885f-efa0680cd231",
        "symbol": "WETH",
        "name": "Wrapped Ether",
        "assetType": "ERC20",
        "decimals": 18,
        "assetIdentifierName": "Contract Address",
        "assetIdentifierValue": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "parentAssetId": "4e4d9982-3469-421b-ab60-2c0c2f05386a"
    }
]

const url = new URL(window.location.href);
const walletClientName = url.searchParams.get("walletClientName") || undefined;
const sampleAssetMapping = (walletClientName && sampleAssetMappings[walletClientName]) || sampleAssetMappings['cruxdev'];
const privateKey = url.searchParams.get("key") || undefined;
doc.getElementById('clientAssets').textContent = Object.keys(sampleAssetMapping).map((currency) => { let assetId = sampleAssetMapping[currency]; return `${currency.toUpperCase()} - ${assetId}` }).join('\n')


// ----- @crux/js-sdk integration --- //

// ManualKeyManager
let signatureRequestsCount = 0;
const manualKeyManager = new ManualKeyManager("03c2156930598a7e4832ebb8b435abcc657b1f14b7953b2145ae25268dd6141c1f", (payload: any): Promise<string> => {
    doc.getElementById("signer").style.display = "block";
    const signatureRequests = doc.getElementById("signatureRequests");
    const index = signatureRequestsCount;
    const payloadString = JSON.stringify(payload);
    console.log(payloadString);
    signatureRequests.innerHTML += `
        <br><pre id="payload_${index}" style="overflow-x:scroll;">${payloadString}</pre><br>
        <textarea id="signature_${index}" rows="10" cols="50%"></textarea><br>
    `
    signatureRequestsCount += 1;
    const signaturePromise = new Promise<string>((resolve, reject) => {
        const submitSignatures = doc.getElementById("submitSignatures");
        submitSignatures.addEventListener('click', () => {
            const signature = doc.getElementById(`signature_${index}`);
            doc.getElementById("signer").style.display = "none";
            resolve(signature.value);
        })
    })
    return signaturePromise;
});

// defining cruxOnBoardingClientOptions
const cruxOnBoardingClientOptions: ICruxOnBoardingClientOptions = {
    // cacheStorage: new LocalStorage(),
    // configKey: manualKeyManager,
    configKey: privateKey,
    // cruxdev_config_key = "9d642ba222d8fa887c108472883d702511b9e06d004f456a78d85a740b789dd2"
    domain: walletClientName,
}

// initialising the cruxOnBoardingClient
const cruxOnBoardingClient = new CruxOnBoardingClient(cruxOnBoardingClientOptions);

function handleCruxDomainStatus(cruxDomainStatus) {
    if (cruxDomainStatus === DomainRegistrationStatus.REGISTERED) {
        [].forEach.call(doc.getElementsByClassName('unregistered'), (el: HTMLElement) => {
            el.style.display = "none"
        });
        [].forEach.call(doc.getElementsByClassName('registered'), (el: HTMLElement) => {
            el.style.display = "block"
        });
    }
    // add hook to enable registered elements
    doc.getElementById('init').style.display = "none"
}

function initError(error) {
    let message = "cruxOnBoardingClient Initialization Error: \n" + error;
    alert(message);
    console.log(error);
    doc.getElementById('init').innerHTML = message;
}


// SDK functional interface

const iscruxDomainAvailable = async () => {
    let UIResponse: string = ""
    doc.getElementById('availability').textContent = "checking availability ..."
    let cruxDomain = doc.getElementById('registrationDomain').value
    try {
        let available = await cruxOnBoardingClient.isCruxDomainAvailable(cruxDomain)
        UIResponse = available ? "available" : "unavailable"
    } catch (e) {
        if (e instanceof CruxOnBoardingClientError) {
            UIResponse = `${e.errorCode}: ${e}`
        } else {
            UIResponse = e
        }

    } finally {
        doc.getElementById('availability').textContent = UIResponse
    }
}
const registercruxDomain = async () => {
    let UIResponse: string = ""
    let cruxDomain = doc.getElementById('newDomain').value
    try {
        await cruxOnBoardingClient.registerCruxDomain(cruxDomain)
        UIResponse = 'cruxDomain registration initiated!'
        try {
            await cruxOnBoardingClient.putAssetMapping(sampleAssetMapping)
            UIResponse += `\nsuccessfully registered: ${cruxDomain}`
        } catch (e_1) {
            if (e_1 instanceof CruxOnBoardingClientError) {
                UIResponse += `\n${e_1.errorCode}: ${e_1}`
            } else {
                UIResponse += '\n' + e_1
            }
        }
    } catch (e) {
        if (e instanceof CruxOnBoardingClientError) {
            UIResponse = `${e.errorCode}: ${e}`
        } else {
            UIResponse = e
        }
    } finally {
        doc.getElementById('registrationAcknowledgement').textContent = UIResponse
    }
}
const getAssetMapping = async () => {
    let UIResponse: string = ""
    try {
        let assetMap = await cruxOnBoardingClient.getAssetMapping()
        UIResponse = JSON.stringify(assetMap, undefined, 4)
    } catch (e) {
        if (e instanceof CruxOnBoardingClientError) {
            UIResponse = `${e.errorCode}: ${e}`
        } else {
            UIResponse = e
        }
    } finally {
        doc.getElementById('assetMap').textContent = UIResponse
    }
}
const getSupportedParentAssetFallbacks = async () => {
    let UIResponse: string = ""
    try {
        let supportedParentAssetFallbacks = await cruxOnBoardingClient.getSupportedParentAssetFallbacks()
        UIResponse = JSON.stringify(supportedParentAssetFallbacks, undefined, 4)
    } catch (e) {
        if (e instanceof CruxOnBoardingClientError) {
            UIResponse = `${e.errorCode}: ${e}`
        } else {
            UIResponse = e
        }
    } finally {
        doc.getElementById('supportedParentAssetFallbacks').textContent = UIResponse
    }
}
const putAssetMapping = async () => {
    let UIResponse: string = ""
    const newAssetMap: IClientAssetMapping = sampleAssetMapping;
    try {
        doc.getElementById('putAssetMapAcknowledgement').textContent = "Publishing your global asset mapping..."
        await cruxOnBoardingClient.putAssetMapping(newAssetMap)
        UIResponse = `successfully published asset map!`
    } catch (e) {
        if (e instanceof CruxOnBoardingClientError) {
            UIResponse = `${e.errorCode}: ${e}`
        } else {
            UIResponse = e
        }
    } finally {
        doc.getElementById('putAssetMapAcknowledgement').textContent = UIResponse
    }
}
const putSupportedParentAssetFallbacks = async () => {
    let UIResponse: string = ""
    const newSupportedParentAssetFallbacks: string[] = sampleSupportedParentAssetFallbacks;
    try {
        doc.getElementById('putSupportedParentAssetFallbacksAcknowledgement').textContent = "Publishing your supported parent asset fallbacks..."
        await cruxOnBoardingClient.putSupportedParentAssetFallbacks(newSupportedParentAssetFallbacks)
        UIResponse = `successfully published supported parent asset fallbacks!`
    } catch (e) {
        if (e instanceof CruxOnBoardingClientError) {
            UIResponse = `${e.errorCode}: ${e}`
        } else {
            UIResponse = e
        }
    } finally {
        doc.getElementById('putSupportedParentAssetFallbacksAcknowledgement').textContent = UIResponse
    }
}
const getNameServiceConfig = async () => {
    let UIResponse: string = ""
    try {
        let nameServiceConfig = await cruxOnBoardingClient.getNameServiceConfig()
        UIResponse = nameServiceConfig ? JSON.stringify(nameServiceConfig, undefined, 4): "{}";
    } catch (e) {
        if (e instanceof CruxOnBoardingClientError) {
            UIResponse = `${e.errorCode}: ${e}`
        } else {
            UIResponse = e
        }
    } finally {
        doc.getElementById('nameServiceConfig').textContent = UIResponse
    }
}
const putNameServiceConfig = async () => {
    let UIResponse: string = ""
    try {
        doc.getElementById('putClientConfigAcknowledgement').textContent = "Publishing your nameservice config..."
        await cruxOnBoardingClient.putNameServiceConfig(sampleNameserviceConfig)
        UIResponse = `successfully published NameServiceConfig!`
    } catch (e) {
        if (e instanceof CruxOnBoardingClientError) {
            UIResponse = `${e.errorCode}: ${e}`
        } else {
            UIResponse = e
        }
    } finally {
        doc.getElementById('putClientConfigAcknowledgement').textContent = UIResponse
    }
}
const getCruxDomainState = async (): Promise<DomainRegistrationStatus> => {
    let UIResponse: string = ""
    let cruxDomainStatus: DomainRegistrationStatus = DomainRegistrationStatus.AVAILABLE;
    try {
        cruxDomainStatus = await cruxOnBoardingClient.getCruxDomainState()
        UIResponse = JSON.stringify(cruxDomainStatus, undefined, 4)
    } catch (e) {
        if (e instanceof CruxOnBoardingClientError) {
            UIResponse = `${e.errorCode}: ${e}`
        } else {
            UIResponse = e
        }
    } finally {
        doc.getElementById('cruxDomainStatus').textContent = UIResponse
    }
    return cruxDomainStatus
}


// on-page-load

getCruxDomainState()
    .then((cruxDomainStatus) => {
        handleCruxDomainStatus(cruxDomainStatus);
    }).catch((error) => {
        initError(error)
    })


declare global {
    interface Window {
        CruxSpec: typeof CruxSpec;
        cruxOnBoardingClient: CruxOnBoardingClient;
        iscruxDomainAvailable: Function;
        registercruxDomain: Function;
        getAssetMapping: Function;
        putAssetMapping: Function;
        getNameServiceConfig: Function;
        putNameServiceConfig: Function;
        getCruxDomainState: Function;
        getSupportedParentAssetFallbacks: Function;
        putSupportedParentAssetFallbacks: Function;
    }
}
window.CruxSpec = CruxSpec;
window.cruxOnBoardingClient = cruxOnBoardingClient;
window.iscruxDomainAvailable = iscruxDomainAvailable;
window.registercruxDomain = registercruxDomain;
window.getAssetMapping = getAssetMapping;
window.putAssetMapping = putAssetMapping;
window.getNameServiceConfig = getNameServiceConfig;
window.putNameServiceConfig = putNameServiceConfig;
window.getCruxDomainState = getCruxDomainState;
window.getSupportedParentAssetFallbacks = getSupportedParentAssetFallbacks;
window.putSupportedParentAssetFallbacks = putSupportedParentAssetFallbacks;