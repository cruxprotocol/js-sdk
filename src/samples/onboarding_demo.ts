import { CruxOnBoardingClient, ICruxOnBoardingClientOptions } from "../clients/crux-wallet-onboarding-client";
import { errors } from "../index";
import { LocalStorage } from "../packages/storage";
import { IGlobalAssetList, IClientAssetMapping } from "../packages/configuration-service";
import { IBlockstackServiceInputOptions } from "../packages/name-service/blockstack-service";
import { DomainRegistrationStatus } from "../core/entities/crux-domain";

const doc = (document as {
    getElementById: Function,
    getElementsByName: Function,
    getElementsByClassName: Function
})

// Demo wallet artifacts

const sampleAssetMapping = {
    "btc": "d78c26f8-7c13-4909-bf62-57d7623f8ee8",
    "eth": "4e4d9982-3469-421b-ab60-2c0c2f05386a",
    "xrp": "abe0030a-d8e3-4518-879f-cd9939b7d8ab",
    "trx": "ab212c90-a2ab-48cf-873c-a7b6e97d8935",
    "eos": "948a4b55-be93-4caa-ab6e-9b2076a0a958",
    "ltc": "d79b9ece-a918-4523-b2bc-74071675b54a",
    "life": "0fcdab6b-9ca8-48d9-9254-32b078a2b31e"
}
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
    }
]


doc.getElementById('clientAssets').textContent = Object.keys(sampleAssetMapping).map((currency) => { let assetId = sampleAssetMapping[currency]; return `${currency.toUpperCase()} - ${assetId}` }).join('\n')


// ----- @crux/js-sdk integration --- //

// defining cruxOnBoardingClientOptions
const cruxOnBoardingClientOptions: ICruxOnBoardingClientOptions = {
    cacheStorage: new LocalStorage(),
    // configKey: "9d642ba222d8fa887c108472883d702511b9e06d004f456a78d85a740b789dd2",
    // assetMapping: sampleAssetMapping,
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
        if (e instanceof errors.CruxClientError) {
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
            if (e_1 instanceof errors.CruxClientError) {
                UIResponse += `\n${e_1.errorCode}: ${e_1}`
            } else {
                UIResponse += '\n' + e_1
            }
        }
    } catch (e) {
        if (e instanceof errors.CruxClientError) {
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
        if (e instanceof errors.CruxClientError) {
            UIResponse = `${e.errorCode}: ${e}`
        } else {
            UIResponse = e
        }
    } finally {
        doc.getElementById('assetMap').textContent = UIResponse
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
        if (e instanceof errors.CruxClientError) {
            UIResponse = `${e.errorCode}: ${e}`
        } else {
            UIResponse = e
        }
    } finally {
        doc.getElementById('putAssetMapAcknowledgement').textContent = UIResponse
    }
}
const getAssetList = async () => {
    let UIResponse: string = ""
    try {
        let assetList = await cruxOnBoardingClient.getAssetList()
        UIResponse = JSON.stringify(assetList, undefined, 4)
    } catch (e) {
        if (e instanceof errors.CruxClientError) {
            UIResponse = `${e.errorCode}: ${e}`
        } else {
            UIResponse = e
        }
    } finally {
        doc.getElementById('globalAssetList').textContent = UIResponse
    }
}
const putAssetList = async () => {
    let UIResponse: string = ""
    const assetList: IGlobalAssetList = sampleAssetList;
    try {
        doc.getElementById('putGlobalAssetListAcknowledgement').textContent = "Publishing your global asset list..."
        await cruxOnBoardingClient.putAssetList(assetList)
        UIResponse = `successfully published Global Asset List!`
    } catch (e) {
        if (e instanceof errors.CruxClientError) {
            UIResponse = `${e.errorCode}: ${e}`
        } else {
            UIResponse = e
        }
    } finally {
        doc.getElementById('putGlobalAssetListAcknowledgement').textContent = UIResponse
    }
}
const getNameServiceConfig = async () => {
    let UIResponse: string = ""
    try {
        let nameServiceConfig = await cruxOnBoardingClient.getNameServiceConfig()
        UIResponse = nameServiceConfig ? JSON.stringify(nameServiceConfig, undefined, 4): "{}";
    } catch (e) {
        if (e instanceof errors.CruxClientError) {
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
        if (e instanceof errors.CruxClientError) {
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
        if (e instanceof errors.CruxClientError) {
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
        cruxOnBoardingClient: CruxOnBoardingClient;
        iscruxDomainAvailable: Function;
        registercruxDomain: Function;
        getAssetMapping: Function;
        putAssetMapping: Function;
        getAssetList: Function;
        putAssetList: Function;
        getNameServiceConfig: Function;
        putNameServiceConfig: Function;
        getCruxDomainState: Function;
    }
}
window.cruxOnBoardingClient = cruxOnBoardingClient;
window.iscruxDomainAvailable = iscruxDomainAvailable;
window.registercruxDomain = registercruxDomain;
window.getAssetMapping = getAssetMapping;
window.putAssetMapping = putAssetMapping;
window.getAssetList = getAssetList;
window.putAssetList = putAssetList;
window.getNameServiceConfig = getNameServiceConfig;
window.putNameServiceConfig = putNameServiceConfig;
window.getCruxDomainState = getCruxDomainState;