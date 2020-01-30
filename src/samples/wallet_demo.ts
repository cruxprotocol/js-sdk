import { CruxWalletClient, IAddressMapping, LocalStorage, ICruxWalletClientOptions, CruxClientError, ICruxIDState, IAssetMatcher, SubdomainRegistrationStatus, SubdomainRegistrationStatusDetail } from "../index";
// TODO: add optional import statement to use the build

const doc = (document as {
    getElementById: Function,
    getElementsByName: Function,
    getElementsByClassName: Function
})



// Demo wallet artifacts

let walletClientName = "cruxdev"
// Value can be withoutInit or withInit
let mode = "withoutInit"
const btcAddress = "1HX4KvtPdg9QUYwQE1kNqTAjmNaDG7w82V"
const ethAddress = "0x0a2311594059b468c9897338b027c8782398b481"
const trxAddress = "TG3iFaVvUs34SGpWq8RG9gnagDLTe1jdyz"
const xrpAddress = "rpfKAA2Ezqoq5wWo3XENdLYdZ8YGziz48h"
const xrpSecIdentifier = "12345"
const lifeAddress = "0xd26114cd6ee289accf82350c8d8487fedb8a0c07"
const zrxAddress = "0xd26114cd6ee289accf82350c8d8487fedb8a0c07"

const sampleAddressMaps: {[walletClientName: string]: IAddressMapping} = {
    "cruxdev": {
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

const parentAssetFallbacks = {
    "cruxdev": ["ERC20_eth"],
    "zel_dev": ["ERC20_ethereum"],
};

const url = new URL(window.location.href);
mode = url.searchParams.get("mode") || mode;
walletClientName = url.searchParams.get("walletClientName") || walletClientName;
const sampleAddressMap = sampleAddressMaps[Object.keys(sampleAddressMaps).find((keyString) => keyString.split(',').includes(walletClientName))];
const sampleParentAssetFallbacks = parentAssetFallbacks[Object.keys(parentAssetFallbacks).find((keyString) => keyString.split(',').includes(walletClientName))];
const privateKey = url.searchParams.get("key");
// mascot6699@cruxdev.crux - ["cdf2d276caf0c9c34258ed6ebd0e60e0e8b3d9a7b8a9a717f2e19ed9b37f7c6f"]

doc.getElementById('mode').textContent = `'${mode}'`;
[].forEach.call(doc.getElementsByClassName('walletClientName'), (el: HTMLElement) => { el.textContent = walletClientName })
doc.getElementById('currency').innerHTML = Object.keys(sampleAddressMap).map((currency) => { return `<option value="${currency}">${currency}</option>` }).join('\n')
doc.getElementById('userAddresses').textContent = Object.keys(sampleAddressMap).map((currency) => { let address = sampleAddressMap[currency].addressHash; let secIdentifier = sampleAddressMap[currency].secIdentifier; return `${currency.toUpperCase()} - ${address} ${secIdentifier ? `(${secIdentifier})` : '' }` }).join('\n')
doc.getElementById('publishAddresses').innerHTML = Object.keys(sampleAddressMap).map((currency) => { let address = sampleAddressMap[currency].addressHash; let secIdentifier = sampleAddressMap[currency].secIdentifier; return `<input type="checkbox" name="publishAddressOption" currency="${currency.toUpperCase()}" addressHash="${address}" secIdentifier="${secIdentifier}" checked>${currency.toUpperCase()}` }).join('\n')
doc.getElementById('assetMatcher_assetGroups').innerHTML = [...sampleParentAssetFallbacks].map((assetGroup) => `<option value="${assetGroup}">${assetGroup.toUpperCase()}</option>`).join('\n')
doc.getElementById('putParentAssetFallbacks').innerHTML = [...sampleParentAssetFallbacks].map((assetGroup) => `<input type="checkbox" name="putParentAssetFallbacksOption" assetGroup="${assetGroup}" checked>${assetGroup.toUpperCase()}`).join('\n')


// --- @crux/js-sdk integration --- //
// defining cruxClientOptions
const cruxClientOptions: ICruxWalletClientOptions = {
    walletClientName: walletClientName,
    cacheStorage: new LocalStorage(),
    privateKey: privateKey || undefined,
}

// initialising the cruxClient
const cruxClient = new CruxWalletClient(cruxClientOptions)
// const cruxClient = new CruxClient(cruxClientOptions)

// SDK functional interface

const isCruxIDAvailable = async () => {
    let UIResponse: string = ""
    doc.getElementById('availability').textContent = "checking availability ..."
    let cruxID = doc.getElementById('registrationId').value
    try {
        let available = await cruxClient.isCruxIDAvailable(cruxID)
        UIResponse = available ? "available" : "unavailable"
    } catch (e) {
        if (e instanceof CruxClientError) {
            UIResponse = `${e.errorCode}: ${e}`
        } else {
            UIResponse = e
        }

    } finally {
        doc.getElementById('availability').textContent = UIResponse
    }
}
const registerCruxID = async () => {
    let UIResponse: string = ""
    let cruxID = doc.getElementById('newSubdomain').value
    try {
        await cruxClient.registerCruxID(cruxID)
        UIResponse = 'cruxID registration initiated!'
        try {
            const { success, failures } = await cruxClient.putAddressMap(sampleAddressMap)
            UIResponse += `\nsuccessfully published: ${JSON.stringify(success)}, \nFailed publishing: ${JSON.stringify(failures, undefined, 4)}`
            try {
                const enabledParentAssetFallbacks = await cruxClient.putParentAssetFallbacks(sampleParentAssetFallbacks);
                UIResponse += `\nsuccessfully enabledParentAssetFallbacks: ${enabledParentAssetFallbacks}`
            } catch (e_2) {
                if (e_2 instanceof CruxClientError) {
                    UIResponse += `\n${e_2.errorCode}: ${e_2}`
                } else {
                    UIResponse += '\n' + e_2
                }
            }
        } catch (e_1) {
            if (e_1 instanceof CruxClientError) {
                UIResponse += `\n${e_1.errorCode}: ${e_1}`
            } else {
                UIResponse += '\n' + e_1
            }
        }
    } catch (e) {
        if (e instanceof CruxClientError) {
            UIResponse = `${e.errorCode}: ${e}`
        } else {
            UIResponse = e
        }
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
        if (e instanceof CruxClientError) {
            UIResponse = `${e.errorCode}: ${e}`
        } else {
            UIResponse = e
        }
    } finally {
        doc.getElementById('addresses').textContent = UIResponse
    }

}
const resolveAssetAddressForCruxID = async () => {
    let UIResponse: string = ""
    let cruxID = doc.getElementById('receiverVirtualAddress').value
    let assetMatcher: IAssetMatcher = {
        assetGroup: doc.getElementById('assetMatcher_assetGroups').value,
        assetIdentifierValue: doc.getElementById('assetMatcher_assetIdentifierValue').value || undefined,
    };
    doc.getElementById('addresses').textContent = `resolving cruxID (${cruxID}) with the given assetMatcher...`
    try {
        let resolvedAddress = await cruxClient.resolveAssetAddressForCruxID(cruxID, assetMatcher);
        UIResponse = JSON.stringify(resolvedAddress, undefined, 4)
    } catch (e) {
        if (e instanceof CruxClientError) {
            UIResponse = `${e.errorCode}: ${e}`
        } else {
            UIResponse = e
        }
    } finally {
        doc.getElementById('addresses').textContent = UIResponse
    }

}
const getAssetMap = async () => {
    let UIResponse: string = ""
    try {
        let assetMap = await cruxClient.getAssetMap()
        UIResponse = JSON.stringify(assetMap, undefined, 4)
    } catch (e) {
        if (e instanceof CruxClientError) {
            UIResponse = `${e.errorCode}: ${e}`
        } else {
            UIResponse = e
        }
    } finally {
        doc.getElementById('assetMap').textContent = UIResponse
    }
}
const getAddressMap = async () => {
    let UIResponse: string = ""
    try {
        let addressMap = await cruxClient.getAddressMap()
        UIResponse = JSON.stringify(addressMap, undefined, 4)
    } catch (e) {
        if (e instanceof CruxClientError) {
            UIResponse = `${e.errorCode}: ${e}`
        } else {
            UIResponse = e
        }
    } finally {
        doc.getElementById('addressMap').textContent = UIResponse
    }
}
const putAddressMap = async () => {
    let UIResponse: string = ""
    let addressMap: IAddressMapping = {};
    [].forEach.call(doc.getElementsByName('publishAddressOption'), (el: HTMLInputElement) => {
        if (el.checked) {
            addressMap[el.attributes['currency'].nodeValue] = {
                addressHash: el.attributes['addressHash'].nodeValue,
                secIdentifier: el.attributes['secIdentifier'].nodeValue === "undefined" ? undefined : el.attributes['secIdentifier'].nodeValue
            }
        }
    });
    try {
        doc.getElementById('putAddressMapAcknowledgement').textContent = "Publishing your selected addresses..."
        let {success, failures} = await cruxClient.putAddressMap(addressMap)
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
const putParentAssetFallbacks = async () => {
    let UIResponse: string = ""
    let assetGroups: string[] = [];
    [].forEach.call(doc.getElementsByName('putParentAssetFallbacksOption'), (el: HTMLInputElement) => {
        if (el.checked) {
            assetGroups.push(el.attributes['assetGroup'].nodeValue);
        }
    });
    try {
        doc.getElementById('putParentAssetFallbacksAcknowledgement').textContent = "Publishing your parent fallback configuration..."
        const enabledParentAssetFallbacks = await cruxClient.putParentAssetFallbacks(assetGroups)
        UIResponse = `successfully enabledParentAssetFallbacks: ${enabledParentAssetFallbacks}`
    } catch (e) {
        if (e instanceof CruxClientError) {
            UIResponse = `${e.errorCode}: ${e}`
        } else {
            UIResponse = e
        }
    } finally {
        doc.getElementById('putParentAssetFallbacksAcknowledgement').textContent = UIResponse
    }
}
const getCruxIDState = async (): Promise<ICruxIDState> => {
    let UIResponse: string = ""
    let cruxIDStatus: ICruxIDState = {cruxID: null, status: {status: SubdomainRegistrationStatus.NONE, statusDetail: SubdomainRegistrationStatusDetail.NONE}}
    try {
        cruxIDStatus = await cruxClient.getCruxIDState()
        UIResponse = JSON.stringify(cruxIDStatus, undefined, 4)
    } catch (e) {
        if (e instanceof CruxClientError) {
            UIResponse = `${e.errorCode}: ${e}`
        } else {
            UIResponse = e
        }
    } finally {
        doc.getElementById('cruxIDStatus').textContent = UIResponse
    }
    return cruxIDStatus
}

function handleCruxIDStatus(cruxIDStatus) {
    if (cruxIDStatus.status && cruxIDStatus.status.status === "DONE") {
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
    let message = "CruxClient Initialization Error: \n" + error;
    alert(message);
    console.log(error);
    doc.getElementById('init').innerHTML = message;
}

// on page load
getCruxIDState()
    .then((cruxIDStatus) => {
        handleCruxIDStatus(cruxIDStatus);
    }).catch((error) => {
        initError(error)
    })

// Declaring global variables to be accessible for (button clicks or debugging purposes)
declare global {
    interface Window {
        wallet: CruxWalletClient;
        isCruxIDAvailable: Function;
        registerCruxID: Function;
        resolveCurrencyAddressForCruxID: Function;
        resolveAssetAddressForCruxID: Function;
        getAssetMap: Function;
        getAddressMap: Function;
        putAddressMap: Function;
        putParentAssetFallbacks: Function;
        getCruxIDState: Function;
    }
}

window.wallet = cruxClient;
window.isCruxIDAvailable = isCruxIDAvailable;
window.registerCruxID = registerCruxID;
window.resolveCurrencyAddressForCruxID = resolveCurrencyAddressForCruxID;
window.resolveAssetAddressForCruxID = resolveAssetAddressForCruxID;
window.getAssetMap = getAssetMap;
window.getAddressMap = getAddressMap;
window.putAddressMap = putAddressMap;
window.putParentAssetFallbacks = putParentAssetFallbacks;
window.getCruxIDState = getCruxIDState;
