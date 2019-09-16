import { OpenPayWallet, IAddressMapping, LocalStorage } from "../src/index";
import OpenPayWalletClient from "../src/client"; 

const encryptionKey = "encryptionKey"
const wallet_btc_address = "1HX4KvtPdg9QUYwQE1kNqTAjmNaDG7w82V"

let sampleAddressMap: IAddressMapping = {
    btc: {
        addressHash: wallet_btc_address
    }
}

window.onload = async () => {
    await OpenPayWalletClient.init({
        'storage': new LocalStorage(),
        'walletGetAddressByCurrency': () => sampleAddressMap,
        'walletOpenApprovalPopup': async (setupResult) => true,
        'walletAcknowledgeAction': (action) => true,
        'getKey': () => "fookey"
    })
}



// SDK integration
// TODO: need to migrate to the new wallet integration interface with config initialisation

window.wallet = OpenPayWalletClient;

document.getElementById('address').innerHTML = wallet_btc_address


const havePayIDClaim = () => {
    document.getElementById('user').innerHTML = window.wallet.hasPayIDClaim() ? 'Yes' : 'No'
}

window.havePayIDClaim = havePayIDClaim


const getPayIDClaim = () => {
    document.getElementById('user').innerHTML = JSON.stringify(window.wallet.getPayIDClaim(), undefined, 4)
}

window.getPayIDClaim = getPayIDClaim


const addPayIDClaim = async () => {
    let vA = document.getElementById('virtualAddress').value
    let pass = document.getElementById('passcode').value

    await window.wallet.addPayIDClaim(vA, pass, sampleAddressMap)
}

window.addPayIDClaim = addPayIDClaim


const invokeSetup = async () => {
    console.log('invokeSetup called')

    window.wallet.invokeSetup({
        availableCurrencies: Object.keys(sampleAddressMap)
    })
}

window.invokeSetup = invokeSetup


const getIdAvailability = async () => {
    let username = document.getElementById('registrationId').value
    document.getElementById('availability').innerHTML = 'checking availability...'
    let availability = await window.wallet.getPublicIdAvailability(username)
    document.getElementById('availability').innerHTML = availability ? 'Available' : 'Unavailable'
}

window.getIdAvailability = getIdAvailability

const resolveAddress = async () => {
    let receiverVirtualAddress = document.getElementById('receiverVirtualAddress').value
    let currency = document.getElementById('currency').value
    document.getElementById('addresses').innerHTML = 'resolving...'
    let address = await window.wallet.resolveAddress(receiverVirtualAddress, currency)
    document.getElementById('addresses').innerHTML = address ? JSON.stringify(address, undefined, 4) : `Error/Undefined`
}

window.resolveAddress = resolveAddress


