import {
    CruxWalletClient,
    CruxServiceClient,
    IAddressMapping,
    CruxClientError,
    CruxId,
    keyManagementProtocol,
    InMemStorage
} from "../index";
import { SecureCruxNetwork, CruxSpec } from "../core";
import { getCruxUserRepository, getPubsubClientFactory } from "../application";
import { getCruxdevCruxDomain } from "../test/test-utils";
import { BasicKeyManager } from "../infrastructure";
// TODO: add optional import statement to use the build

const doc = (document as {
    getElementById: Function,
    getElementsByName: Function,
    getElementsByClassName: Function
})



// Demo wallet artifacts

let walletClientName = "local"
const btcAddress = "1HX4KvtPdg9QUYwQE1kNqTAjmNaDG7w82V"
const ethAddress = "0x0a2311594059b468c9897338b027c8782398b481"
const trxAddress = "TG3iFaVvUs34SGpWq8RG9gnagDLTe1jdyz"
const xrpAddress = "rpfKAA2Ezqoq5wWo3XENdLYdZ8YGziz48h"
const xrpSecIdentifier = "12345"
const lifeAddress = "0xd26114cd6ee289accf82350c8d8487fedb8a0c07"
const zrxAddress = "0xd26114cd6ee289accf82350c8d8487fedb8a0c07"

const sampleAddressMaps: {[walletClientName: string]: IAddressMapping} = {
    "local,guarda": {
        btc: {
            addressHash: btcAddress
        },
        eth: {
            addressHash: ethAddress
        },
        trx: {
            addressHash: trxAddress
        },
        xrp: {
            addressHash: xrpAddress,
            secIdentifier: xrpSecIdentifier
        },
        life: {
            addressHash: lifeAddress,
        },
    },
    "zel_dev": {
        bitcoin: {
            addressHash: btcAddress
        },
        ethereum: {
            addressHash: ethAddress
        },
        tron: {
            addressHash: trxAddress
        },
        ripple: {
            addressHash: xrpAddress,
            secIdentifier: xrpSecIdentifier
        },
        zrx: {
            addressHash: zrxAddress,
        }
    }
};

const sampleAddressMap = sampleAddressMaps[Object.keys(sampleAddressMaps).find((keyString) => keyString.split(',').includes(walletClientName))];
console.log(sampleAddressMap, sampleAddressMaps);
doc.getElementById('publishAddresses').innerHTML = Object.keys(sampleAddressMap).map((currency) => { let address = sampleAddressMap[currency].addressHash; let secIdentifier = sampleAddressMap[currency].secIdentifier; return `<input type="checkbox" name="publishAddressOption" currency="${currency.toUpperCase()}" addressHash="${address}" secIdentifier="${secIdentifier}" checked>${currency.toUpperCase()}` }).join('\n')


// --- @crux/js-sdk integration --- //
const userCruxId = CruxId.fromString("release020@cruxdev.crux");
const userPvtKey = "KyBuSe1MMV6NjJgZfyWuvgmxUeAYswLC2HrfYLUri9aP3AS5FBfr";
const userBasicKeyManager = new BasicKeyManager(userPvtKey);

const selfIdClaim = {
    cruxId: userCruxId,
    keyManager: userBasicKeyManager
}

const secureCruxNetwork = new SecureCruxNetwork(getCruxUserRepository({
    blockstackInfrastructure: CruxSpec.blockstack.infrastructure,
    cruxDomain: getCruxdevCruxDomain(),
    cacheStorage: new InMemStorage(),
}), getPubsubClientFactory(), selfIdClaim);

const cruxServiceClient = new CruxServiceClient({
    cruxId: userCruxId,
    keyManager: userBasicKeyManager
}, secureCruxNetwork, keyManagementProtocol);

let remoteWalletClient: CruxWalletClient;

const getRemoteWalletClient = async () => {
    let UIResponse: string = "Fetching RemoteWalletClient..."
    doc.getElementById('getRemoteWalletClientAcknowledgement').textContent = UIResponse;
    let remoteUserId = CruxId.fromString(doc.getElementById('remoteUserId').value);
    try{
        remoteWalletClient = await cruxServiceClient.getWalletClientForUser(remoteUserId);
        UIResponse = `RemoteWalletClient has been initialized for: ${remoteUserId}`
    } catch (e) {
        console.log(e);
        if (e instanceof CruxClientError) {
            UIResponse = `${e.errorCode}: ${e}`
        } else {
            UIResponse = e
        }
    } finally {
        doc.getElementById('getRemoteWalletClientAcknowledgement').textContent = UIResponse
    }
}

const getAddressMap = async () => {
    let UIResponse: string = "fetching addressMap remotely..."
    doc.getElementById('getAddressMapAcknowledgement').textContent = UIResponse;
    try {
        let addressMap = await remoteWalletClient.getAddressMap()
        UIResponse = JSON.stringify(addressMap, undefined, 4)
    } catch (e) {
        if (e instanceof CruxClientError) {
            UIResponse = `${e.errorCode}: ${e}`
        } else {
            UIResponse = e
        }
    } finally {
        doc.getElementById('getAddressMapAcknowledgement').textContent = UIResponse
    }
}

const putAddressMap = async () => {
    let UIResponse: string = "Publishing your selected addresses remotely..."
    let addressMap: IAddressMapping = {};
    // @ts-ignore
    [].forEach.call(doc.getElementsByName('publishAddressOption'), (el: HTMLInputElement) => {
        if (el.checked) {
            addressMap[el.attributes['currency'].nodeValue] = {
                addressHash: el.attributes['addressHash'].nodeValue,
                secIdentifier: el.attributes['secIdentifier'].nodeValue === "undefined" ? undefined : el.attributes['secIdentifier'].nodeValue
            }
        }
    });
    doc.getElementById('putAddressMapAcknowledgement').textContent = UIResponse
    try {
        let {success, failures} = await remoteWalletClient.putAddressMap(addressMap)
        UIResponse = `successfully published: ${JSON.stringify(success)}, \nFailed publishing: ${JSON.stringify(failures, undefined, 4)}`
    } catch (e) {
        if (e instanceof CruxClientError) {
            UIResponse = `${e.errorCode}: ${e}`
        } else {
            UIResponse = e
        }
    } finally {
        doc.getElementById('putAddressMapAcknowledgement').textContent = UIResponse
    }
}

// Declaring global variables to be accessible for (button clicks or debugging purposes)
declare global {
    interface Window {
        remoteWalletClient: CruxWalletClient;
        getRemoteWalletClient: Function;
        getAddressMap: Function;
        putAddressMap: Function;
    }
}

window.remoteWalletClient = remoteWalletClient;
window.getRemoteWalletClient = getRemoteWalletClient;
window.getAddressMap = getAddressMap;
window.putAddressMap = putAddressMap;
