import { OpenPayWallet, IAddressMapping } from "../src/index";

const encryptionKey = "encryptionKey"
const wallet_btc_address = "1HX4KvtPdg9QUYwQE1kNqTAjmNaDG7w82V"

let sampleAddressMap: IAddressMapping = {
    btc: {
        addressHash: wallet_btc_address
    }
}



// SDK integration
// TODO: need to migrate to the new wallet integration interface with config initialisation

window.wallet = new OpenPayWallet({
    getEncryptionKey: () => { return encryptionKey }
});

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
    document.getElementById('addresses').innerHTML = address ? address.toString() : `Error/Undefined`
}

window.resolveAddress = resolveAddress


