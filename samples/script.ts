import { IPayIDClaim, IPaymentRequest, OpenPayWallet, OpenPayService, IAddressMapping } from "../src/index";


window.OpenPayWallet = OpenPayWallet
window.OpenPayService = OpenPayService





// Wallet
const wallet_btc_address = "1HX4KvtPdg9QUYwQE1kNqTAjmNaDG7w82V"

let sampleAddressMap: IAddressMapping = {
    btc: {
        addressHash: wallet_btc_address
    }
}

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

const openpayService = new OpenPayService()

window.service = openpayService

window.sendPaymentRequest = () => {
    let payIDClaim = sessionStorage.getItem('payIDClaim') || localStorage.getItem('payIDClaim')
    openpayService.addPayIDClaim(payIDClaim.virtualAddress, payIDClaim.passcode)

    let receiverVirtualAddress: string =  document.getElementById('receiver').value
    let receiverPasscode: string = prompt('Receiver passcode')
    // Storage.setItem('peerVirtualAddress', receiverVirtualAddress)
    openpayService.sendPaymentRequest(receiverVirtualAddress, dummyPaymentRequest, receiverPasscode)
}

// Helper methods
function hideDom(id) {
    var arr;
    if (!Array.isArray(id)) {
        arr = [id];
    } else {
        arr = id;
    }
    arr.forEach(function (domid) {
        document.getElementById(domid).style.display = 'none';
    });
}

function showDom(id) {
    var arr;
    if (!Array.isArray(id)) {
        arr = [id];
    } else {
        arr = id;
    }
    arr.forEach(function (domid) {
        document.getElementById(domid).style.display = 'initial';
    });
}

function displayUserInformation(user) {
    hideDom('coinswitch-container');
    document.getElementById('newPayIDName').textContent = 'newPayIDName: ' + user.newPayIDName;
    document.getElementById('encryptedNewPayIDPass').textContent = 'encryptedNewPayIDPass: ' + user.encryptedNewPayIDPass;
    showDom('userInformation');
}

function displayLoginContainer() {
    hideDom('userInformation');
    showDom('coinswitch-container');
}

function initSpinner() {
    var spinner = new Spinner().spin();
    document.getElementById('spinner').appendChild(spinner.el);
}


function thirdPartyIntegrationCode (data){
    if (data.type === 'emailPrepopulation') {
        console.log('Received Email Message: ' + data);
    } else if (data.type === 'register') {
        console.log('Received after register message: '+ data);
        displayUserInformation(data);
    }
}



window.invokePaymentSetup = async (event) => {
    console.log(event)
    event.preventDefault()
    let serviceOptions = {
        serviceName: "Keys4Coins",
        experience: "newtab",
        handler: thirdPartyIntegrationCode
    }
    let openpayUI = await openpayService.invokeServiceSetup(serviceOptions)
    window.openpayUI = openpayUI
}
