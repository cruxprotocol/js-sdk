import { CruxOnBoardingClient, ICruxOnBoardingClientOptions } from "../application/clients/crux-wallet-onboarding";
import { CruxOnBoardingClientError } from "../application/clients/crux-wallet-onboarding/utils";
import { LocalStorage } from "../packages/storage";
import { IClientAssetMapping } from "../packages/configuration-service";
import { IBlockstackServiceInputOptions } from "../packages/name-service/blockstack-service";
import { DomainRegistrationStatus } from "../core/entities/crux-domain";
import { ManualKeyManager } from "../infrastructure/implementations/manual-key-manager";
import { CruxSpec } from "../core/entities/crux-spec";

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
    configKey: "9d642ba222d8fa887c108472883d702511b9e06d004f456a78d85a740b789dd2",
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