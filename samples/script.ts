import { IPayIDClaim, IPaymentRequest, OpenPayWalletExperimental, OpenPayServiceExperimental, IAddressMapping } from "../src/index";


window.OpenPayWallet = OpenPayWalletExperimental
window.OpenPayService = OpenPayServiceExperimental





// Wallet
const wallet_btc_address = "1HX4KvtPdg9QUYwQE1kNqTAjmNaDG7w82V"

let sampleAddressMap: IAddressMapping = {
    btc: {
        addressHash: wallet_btc_address
    }
}

// Move the input logic to wallet side
const openpayWallet = new OpenPayWalletExperimental()

window.wallet = openpayWallet

// Initial setup

document.getElementById('address').innerHTML = wallet_btc_address

openpayWallet.on('request', (a) => {
    console.log("EventParser", a)
    openpayWallet.sendMessageToChannelId(a.receiverVirtualAddress, {format: 'openpay_v1', type: 'ack', id: String(Date.now()), payload: {ackid: a.id, type: 'payment_received'}})
    document.getElementById('requests').innerHTML += JSON.stringify(a, undefined, 4) + `
    <button onclick="((receiverVirtualAddress, id) => {
        window.wallet.sendMessageToChannelId(receiverVirtualAddress, {format: 'openpay_v1', type: 'ack', id: String(Date.now()), payload: {ackid: id, type: 'payment_initiated'}})
    })('${a.receiverVirtualAddress}', ${a.id})">Accept Request</button>
    `
})

const checkStatus = () => {
    document.getElementById('status').innerHTML = wallet.isActive() ? 'Active' : 'Inactive'
}

window.checkStatus = checkStatus

const havePayIDClaim = () => {
    document.getElementById('user').innerHTML = wallet.hasPayIDClaim() ? 'Yes' : 'No'
}

window.havePayIDClaim = havePayIDClaim

const getPayIDClaim = () => {
    document.getElementById('user').innerHTML = JSON.stringify(wallet.getPayIDClaim(), undefined, 4)
}

window.getPayIDClaim = getPayIDClaim


const addPayIDClaim = async () => {
    let vA = document.getElementById('virtualAddress').value
    let pass = document.getElementById('passcode').value

    await wallet.addPayIDClaim(vA, pass, sampleAddressMap)
}

window.addPayIDClaim = addPayIDClaim


const getIdAvailability = async () => {
    let username = document.getElementById('registrationId').value
    let availability = await wallet.getPublicIdAvailability(username)
    document.getElementById('availability').innerHTML = availability
}

window.getIdAvailability = getIdAvailability





// Service


const dummyPaymentRequest: IPaymentRequest = {
    format: "",
    currency: "btc",
    toAddress: {
        addressHash: wallet_btc_address
    },
    value: 2
}
window.dummyPaymentRequest = dummyPaymentRequest

const openpayService = new OpenPayServiceExperimental()

window.service = openpayService

window.payWithOpenpay = (event) => {
    event.preventDefault()
    let serviceOptions = {
        serviceName: "Keys4Coins",
        experience: "newtab",
    }
    let openpayUI = openpayService.payWithOpenpay(serviceOptions, dummyPaymentRequest)
}
