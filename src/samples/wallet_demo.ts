import { CruxClient, IAddressMapping } from "../index";
import {Decoder, object, optional, string} from "@mojotech/json-type-validation";
import * as blockstack from "blockstack";
import { decodeToken, TokenSigner } from 'jsontokens'
import { async, resolve } from "q";
// TODO: add optional import statement to use the build

let doc = (document as {
    getElementById: Function,
    getElementsByClassName: Function
})



// Demo wallet artifacts

let walletClientName = "cruxdev"
let encryptionKey = "fookey"
const wallet_btc_address = "1HX4KvtPdg9QUYwQE1kNqTAjmNaDG7w82V"
const wallet_eth_address = "0x0a2311594059b468c9897338b027c8782398b481"

let sampleAddressMap: IAddressMapping = {
    BTC: {
        addressHash: wallet_btc_address
    },
    ETH: {
        addressHash: wallet_eth_address
    }
};

let url = new URL(window.location.href);
encryptionKey = url.searchParams.get("overrideEncryptionKey") || encryptionKey;
walletClientName = url.searchParams.get("walletClientName") || walletClientName;

doc.getElementById('encryptionKey').textContent = `'${encryptionKey}'`;
[].forEach.call(doc.getElementsByClassName('walletClientName'), (el: HTMLElement) => { el.textContent = walletClientName })
doc.getElementById('userAddresses').textContent = Object.keys(sampleAddressMap).map((currency) => { console.log(sampleAddressMap); let address = sampleAddressMap[currency].addressHash; return `${currency.toUpperCase()} - ${address}` }).join('\n')




// --- @crux/js-sdk integration --- //


// defining cruxClientOptions
let cruxClientOptions = {
    getEncryptionKey: () => encryptionKey,
    walletClientName: walletClientName
}

// initialising the cruxClient
let cruxClient = new CruxClient(cruxClientOptions)
cruxClient.init().then(async () => {
    await getCruxIDState()
    doc.getElementById('init').style.display = "none"
}).catch((error) => {
    let message = "CruxClient Initialization Error: \n" + error
    alert(message)
    doc.getElementById('init').innerHTML = message
})


// SDK functional interface


const ramTest = async () => {
    alert('ok');
    // publishClientConfig(clientConfig, getSignPayload);
    getIdStatus('ankit9')
}

const isCruxIDAvailable = async () => {
    let UIResponse: string = ""
    doc.getElementById('availability').textContent = "checking availability ..."
    let cruxID = doc.getElementById('registrationId').value
    try {
        let available = await cruxClient.isCruxIDAvailable(cruxID)
        UIResponse = available ? "available" : "unavailable"
    } catch (e) {
        UIResponse = e
    } finally {
        doc.getElementById('availability').textContent = UIResponse
    }
}
const registerCruxID = async () => {
    let UIResponse: string = ""
    let cruxID = doc.getElementById('newSubdomain').value
    let newAddressMap = sampleAddressMap
    try {
        await cruxClient.registerCruxID(cruxID, newAddressMap)
        UIResponse = "cruxID registration initiated!"
    } catch (e) {
        UIResponse = e
    } finally {
        doc.getElementById('registrationAcknowledgement').textContent = UIResponse
    }
}
const resolveCurrencyAddressForCruxID = async () => {
    let UIResponse: string = ""
    let cruxID = doc.getElementById('receiverVirtualAddress').value
    let walletCurrencySymbol = doc.getElementById('currency').value
    doc.getElementById('addresses').textContent = `resolving cruxID (${cruxID}) ${walletCurrencySymbol} address ...`
    try {
        let resolvedAddress = await cruxClient.resolveCurrencyAddressForCruxID(cruxID, walletCurrencySymbol)
        UIResponse = JSON.stringify(resolvedAddress, undefined, 4)
    } catch (e) {
        UIResponse = e
    } finally {
        doc.getElementById('addresses').textContent = UIResponse
    }

}
const getAddressMap = async () => {
    let UIResponse: string = ""
    try {
        let addressMap = await cruxClient.getAddressMap()
        UIResponse = JSON.stringify(addressMap, undefined, 4)
    } catch (e) {
        UIResponse = e
    } finally {
        doc.getElementById('addressMap').textContent = UIResponse
    }    
}
const putAddressMap = async () => {
    let UIResponse: string = ""
    try {
        let acknowledgement = await cruxClient.putAddressMap(sampleAddressMap)
        UIResponse = acknowledgement ? "successfully published addresses!" : acknowledgement.toString()
    } catch (e) {
        UIResponse = e
    } finally {
        doc.getElementById('putAddressMapAcknowledgement').textContent = UIResponse
    }    
}
const getCruxIDState = async () => {
    let UIResponse: string = ""
    try {
        let cruxIDStatus = await cruxClient.getCruxIDState()
        UIResponse = JSON.stringify(cruxIDStatus, undefined, 4)
    } catch (e) {
        UIResponse = e
    } finally {
        doc.getElementById('cruxIDStatus').textContent = UIResponse
    }    
}
const updatePassword = async () => { 
    let UIResponse: string = ""
    let oldEncryptionKey = doc.getElementById('oldEncryptionKey').value
    let newEncryptionKey = doc.getElementById('newEncryptionKey').value
    try {
        await cruxClient.updatePassword(oldEncryptionKey, newEncryptionKey)
        UIResponse = 'updated password successfully!'
    } catch (e) {
        UIResponse = e
    } finally {
        doc.getElementById('passwordUpdateAcknowledgement').textContent = UIResponse
    }
}


// Declaring global variables to be accessible for (button clicks or debugging purposes)
declare global {
    interface Window {
        wallet: CruxClient;
        isCruxIDAvailable: Function;
        registerCruxID: Function;
        resolveCurrencyAddressForCruxID: Function;
        getAddressMap: Function;
        putAddressMap: Function;
        getCruxIDState: Function;
        updatePassword: Function;
        ramTest: Function;
    }
}


// const signatureCallback = async (payload: {}) => {
//     // please resolve with signed payload
// }

const clientConfig = {
    "clientMapping": {
        "BTC": "1234r",
        "ETH": "qrtvbf",
        "LTC": "nbgffvc"
    }
}
const clientMapping = {
    "BTC": "1234r",
    "ETH": "qrtvbf",
    "LTC": "nbgffvc"
}

export interface IAddress {
    addressHash: string;
    secIdentifier?: string;
}

const uploadClientContentToGaiaHub = async (fileName:string, csAddressMap: object, type: string, gaiaHubUrl: string, publicKey :string, signatureCallback: any, address:any) => {
    // const hubConfigPromise = connectToGaiaHub(gaiaHubUrl, publicKey, signatureCallback);
    // const tokenFilePromise = generateTokenFileForContent(csAddressMap, publicKey, signatureCallback);

    let [hubConfig, tokenFile] = await getAllSignedPayloads(gaiaHubUrl, csAddressMap, publicKey, signatureCallback, address)
    console.info(hubConfig)
    console.info(tokenFile)
    let contentToUpload: any = null;
        if (type === "application/json") {
            contentToUpload = JSON.stringify(tokenFile);
        } else {
            console.groupEnd();
            throw new Error(`Unhandled content-type ${type}`);
        }
        let finalURL: string;
        try {
            finalURL = await blockstack.uploadToGaiaHub(fileName, contentToUpload, hubConfig, type);
        } catch (error) {
            console.groupEnd();
            throw new Error(`unable to upload to gaiahub, ${error}`);
        }
        console.groupEnd();
        return finalURL;
}

const publishClientConfig = async (clientConfig, signatureCallback: any) => {
    const gaiaHubUrl = "https://hub.cruxpay.com"
    const publicKey = "0363409e301867f3756a66ef4bf0ab91eb96f2cad18e2bd8a49d8726c9f7ff6931"
    const address = "1Ep3hL7FjMfutRnJfvAAZgzDpQTHKxJZVm"
        try {
            await uploadClientContentToGaiaHub("client-config.json", clientConfig, "application/json", gaiaHubUrl, publicKey, signatureCallback, address);
        } catch (error) {
            throw new Error(`unable to upload content to gaiahub, ${error}`);
        }
    console.log(clientConfig)
}



export function fetchPrivate(input, init?): Promise<Response> {
    init = init || { }
    init.referrerPolicy = 'no-referrer'
    return fetch(input, init)
  }

const getSignPayload = async(payloadArray: any) => {
    const [payload1, payload2] = payloadArray
    alert("Please Sign this: " + JSON.stringify(payloadArray))
    const signerKeyHex = "dda3c7f72491f8adf592181370dfa15ebb8057e61eed3329b36f53d92ed5a4b6"
    return [new TokenSigner('ES256K', signerKeyHex).sign(payload1), new TokenSigner('ES256K', signerKeyHex).sign(payload2)]
    // https://github.com/blockstack/blockstack.js/blob/e4864ad41f376d963d4917b95996a6032f992789/src/storage/hub.ts#L173
}

const getSignedPayloadFromUser = async (payload: object) => {
    return await getSignPayload(payload);
}


async function makeV1GaiaAuthToken(hubInfo: any, hubUrl: string, publicKey:string, signatureCallback:any): Promise<string> {
    const challengeText = hubInfo.challenge_text
    const handlesV1Auth = (hubInfo.latest_auth_version
    && parseInt(hubInfo.latest_auth_version.slice(1), 10) >= 1)
    const iss = publicKey;


    const salt = new Buffer(crypto.getRandomValues(new Uint32Array(16))).toString('hex')
    const payload = {
        gaiaChallenge: challengeText,
        hubUrl,
        iss,
        salt,
        undefined
    }
    const token = await signatureCallback(payload)
    console.log(token + "===========")
    return `v1:${token}`
}

const connectToGaiaHub = async (gaiaHubUrl: string, publicKey: string, signatureCallback: any) => {
    const response = await fetchPrivate(`${gaiaHubUrl}/hub_info`)
    const hubInfo = await response.json()
    console.log(hubInfo);
    const readURL = hubInfo.read_url_prefix
    const token = await makeV1GaiaAuthToken(hubInfo, gaiaHubUrl, publicKey, signatureCallback)
    const address = publicKey
    console.log(token)
    return {
        url_prefix: readURL,
        address,
        token,
        server: gaiaHubUrl
    }
}

const getAllSignedPayloads = async (gaiaHubUrl: string, content: object, publicKey: string, signatureCallback: any, address:any) => {
    
    // FUNCTION START
    const response = await fetchPrivate(`${gaiaHubUrl}/hub_info`)
    const hubInfo = await response.json()
    console.log(hubInfo);
    const readURL = hubInfo.read_url_prefix
    
    // FUNCTION START
    const challengeText = hubInfo.challenge_text
    const handlesV1Auth = (hubInfo.latest_auth_version
    && parseInt(hubInfo.latest_auth_version.slice(1), 10) >= 1)
    const iss = publicKey;
    const salt = new Buffer(crypto.getRandomValues(new Uint32Array(16))).toString('hex')
    const unsignedPayload1 = {
        gaiaChallenge: challengeText,
        gaiaHubUrl,
        iss,
        salt,
        undefined
    }

    const unsignedPayload2 = {
        claim: content,
        issuer: { publicKey },
        subject: { publicKey },
    };

    const [signedPayload1, signedPayload2] = await signatureCallback([unsignedPayload1, unsignedPayload2])

    console.log(signedPayload1 + "===========")
    const token = `v1:${signedPayload1}`
    // Function End

    //ecPairToAddress(hexStringToECPair(challengeSignerHex+ (challengeSignerHex.length === 64 ? '01' : '')))

    console.log(token)
    const tokenFile = [blockstack.wrapProfileToken(signedPayload2)];

    const return1 = {
        url_prefix: readURL,
        address,
        token,
        server: gaiaHubUrl
    }
    // Function End
    const return2 = tokenFile;  
    return [return1, return2]
}

const generateTokenFileForContent = async (content: object, publicKey: string, signatureCallback: any) => {
    const payload = {
        claim: content,
        issuer: { publicKey },
        subject: { publicKey },
    };
    const token = await signatureCallback(payload)
    console.log(token + "----------")
    const tokenFile = [blockstack.wrapProfileToken(token)];
    return tokenFile;
}





//-------------------------

const parseStatus = (body: any) => {
    let status: any;
        const rawStatus = body.status;
        
        if (rawStatus && rawStatus.includes("Your subdomain was registered in transaction")) {
            status = {
            status: "PENDING",
            status_detail: "",
            };
        } else {
            switch (rawStatus) {
                case "Subdomain not registered with this registrar":
                    status = {
                        status: "NONE",
                        status_detail: "",
                    };
                    break;
                case "Subdomain is queued for update and should be announced within the next few blocks.":
                    status = {
                        status: "PENDING",
                        status_detail: "",
                    };
                    break;
                case "Subdomain propagated":
                        status = {
                            status: "DONE",
                            status_detail: "",
                        };
                        break;
                default:
                    status = {
                        status: "NONE",
                        status_detail: "",
                    };
                    break;
            }
        }
        return status;
}

const getIdStatus = async (subdomain: string) => {
    const url = 'https://registrar.coinswitch.co:4000/status/'+subdomain
    const response = await fetchPrivate(`${url}`)
    const status = parseStatus(await response.json())
    return status
}



window.wallet = cruxClient;
window.isCruxIDAvailable = isCruxIDAvailable;
window.registerCruxID = registerCruxID;
window.resolveCurrencyAddressForCruxID = resolveCurrencyAddressForCruxID;
window.getAddressMap = getAddressMap;
window.putAddressMap = putAddressMap;
window.getCruxIDState = getCruxIDState;
window.updatePassword = updatePassword;
window.ramTest = ramTest;
