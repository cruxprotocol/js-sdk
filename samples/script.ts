import { IPayIDClaim, IPaymentRequest, OpenPayWallet, OpenPayService, Storage, Encryption } from "../../sdk";


window.OpenPayWallet = OpenPayWallet
window.OpenPayService = OpenPayService
window.Storage = Storage
window.Encryption = Encryption






// Wallet
const wallet_btc_address = "1HX4KvtPdg9QUYwQE1kNqTAjmNaDG7w82V"
// Move the input logic to wallet side
const openpayWallet = new OpenPayWallet()

window.wallet = openpayWallet

// Initial setup

document.getElementById('address').innerHTML = wallet_btc_address

openpayWallet.on('request', (a) => {
    console.log("EventParser", a)
    document.getElementById('requests').innerHTML += JSON.stringify(a, undefined, 4)
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


const addPayIDClaim = () => {
    let vA = document.getElementById('virtualAddress').value
    let pass = document.getElementById('passcode').value

    wallet.addPayIDClaim(vA, pass)
}

window.addPayIDClaim = addPayIDClaim












// Service



document.getElementById('receiver').value = Storage.getItem('peerVirtualAddress')

const dummyPaymentRequest: IPaymentRequest = {
    format: "",
    currency: "btc",
    toAddress: {
        addressHash: wallet_btc_address
    },
    value: 2
}
window.dummyPaymentRequest = dummyPaymentRequest

const openpayService = new OpenPayService()

window.service = openpayService

window.sendPaymentRequest = () => {
    let receiverVirtualAddress: string =  document.getElementById('receiver').value
    let receiverPasscode: string = prompt('Receiver passcode')
    Storage.setItem('peerVirtualAddress', receiverVirtualAddress)
    openpayService.sendPaymentRequest(receiverVirtualAddress, dummyPaymentRequest, receiverPasscode)
}

