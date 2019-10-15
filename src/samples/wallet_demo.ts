import { CruxClient } from "../index";
import * as blockstack from "blockstack";
import { TokenSigner } from 'jsontokens'
import 'babel-polyfill';


// // const ramTest = async () => {
// //     getIdStatus('ankit9')
// // }

// // const ramTest1 = async () => {
// //     publishClientConfig(clientConfig, getSignPayload, "zelcore");
// }

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
        getIdStatus: Function;
        publishClientConfig: Function
    }
}

const clientConfig = {
    "clientMapping": {
        "BTC": "ggggg",
        "ETH": "444444444",
        "LTC": "3333333"
    }
}

const uploadClientContentToGaiaHub = async (fileName:string, csAddressMap: object, type: string, gaiaHubUrl: string, publicKey :string, signatureCallback: any, address:any) => {

    let [hubConfig, tokenFile] = await getAllSignedPayloads(gaiaHubUrl, csAddressMap, publicKey, signatureCallback, address)
    // console.info(hubConfig)
    // console.info(tokenFile)
    let contentToUpload: any = null;
        if (type === "application/json") {
            contentToUpload = JSON.stringify(tokenFile);
        } else {
            // console.groupEnd();
            throw new Error(`Unhandled content-type ${type}`);
        }
        let finalURL: string;
        try {
            finalURL = await blockstack.uploadToGaiaHub(fileName, contentToUpload, hubConfig, type);
        } catch (error) {
            // console.groupEnd();
            throw new Error(`unable to upload to gaiahub, ${error}`);
        }
        // console.groupEnd();
        return finalURL;
}

const publishClientConfig = async (clientConfig: any, signatureCallback: any, publicKey:string, address:string, clientName: string) => {
    const gaiaHubUrl = "https://hub.cruxpay.com"
    // const publicKey = "0363409e301867f3756a66ef4bf0ab91eb96f2cad18e2bd8a49d8726c9f7ff6931"
    // const address = "1Ep3hL7FjMfutRnJfvAAZgzDpQTHKxJZVm"
        try {
           const finalURL = await uploadClientContentToGaiaHub(`${clientName}_` + "client-config.json", clientConfig, "application/json", gaiaHubUrl, publicKey, signatureCallback, address);
           return finalURL
        } catch (error) {
            throw new Error(`unable to upload content to gaiahub, ${error}`);
        }
}



export function fetchPrivate(input, init?): Promise<Response> {
    init = init || { }
    init.referrerPolicy = 'no-referrer'
    return fetch(input, init)
  }

const getSignPayload = async(payloadArray: any) => {
    const [payload1, payload2] = payloadArray
    const signerKeyHex = "dda3c7f72491f8adf592181370dfa15ebb8057e61eed3329b36f53d92ed5a4b6"
    return [new TokenSigner('ES256K', signerKeyHex).sign(payload1), new TokenSigner('ES256K', signerKeyHex).sign(payload2)]
    // https://github.com/blockstack/blockstack.js/blob/e4864ad41f376d963d4917b95996a6032f992789/src/storage/hub.ts#L173
}

const getAllSignedPayloads = async (gaiaHubUrl: string, content: object, publicKey: string, signatureCallback: any, address:any) => {
    
    // FUNCTION START
    const response = await fetchPrivate(`${gaiaHubUrl}/hub_info`)
    const hubInfo = await response.json()
    // console.log(hubInfo);
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

    // console.log(signedPayload1)
    const token = `v1:${signedPayload1}`
    // Function End

    //ecPairToAddress(hexStringToECPair(challengeSignerHex+ (challengeSignerHex.length === 64 ? '01' : '')))

    // console.log(token)
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
    // console.log(status)
    return status
}
window.getIdStatus = getIdStatus;
window.publishClientConfig = publishClientConfig;
