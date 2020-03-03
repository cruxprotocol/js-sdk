# CruxPay Official Documentation

[https://docs.cruxpay.com](https://docs.cruxpay.com)

## What is CruxPay?

[CruxPay](https://cruxpay.com/) is a protocol which aims to link any blockchain address to a human-readable name, and let users interact with each other and dApps with ease.


## 1. Install

First you need to get cruxpay sdk into your project. This can be done using the following methods:

- npm: ``npm install @cruxpay/js-sdk``
- pure js: link the [cruxpay-sdk-dom.js](https://unpkg.com/@cruxpay/js-sdk/dist/cruxpay-sdk-dom.js)


## 2. Initialize:

To initialize the sdk, you need to minimally pass a javascript object with following details:-
1. **walletClientName**
    - walletClientName is the key which identifies the wallet specific configurations stored in gaiaHub like 
        1. Subdomain Registrar Information
        2. BNS(BlockStack Name Service) Node
        3. Currency symbol map of your wallet
    - To help you get started, you can use `cruxdev` as the value which is already configured for our dev test users. It has 5 pre-registered crypto symbols for a fast start. You can contact us at [telegram](https://t.me/cruxpay_integration) channel for registration of your own walletClientName.
2. **privateKey (optional)**
    - Required to re-initialise the CruxClient with same user across different devices.
    - For clients using HD derivation paths, recommended to use the path (`m/889'/0'/0'`) for CruxPay keypair node derivation with respect to account indices.

`**Note:** Cruxprotocol JS SDK is case insensetive for cryptocurrency symbols and will always output lowercase symbols.`

Example below shows how to a cruxClient instance. These are the [SDK Operation](#sdk-operation) exposed.   
```javascript
let cruxClientOptions = {
    walletClientName: 'cruxdev',
    privateKey: "6bd397dc89272e71165a0e7d197b280c7a88ed5b1e44e1928c25455506f1968f"  // (optional parameter)
}

let cruxClient = new CruxClient(cruxClientOptions);
```
That's it! now you can use the cruxClient object to perform operations defined in [SDK Operation](#sdk-operation).
```javascript
cruxClient.getCruxIDState().then((cruxIDState) => {
    console.log(cruxIDState);
})
```

Wallet clients are encouraged to surface the respective `ERROR_CODE` of the `CruxClientError` to their Users with any custom error messages. This will help in debugging any issues with the functionality.

Refer [error-handling.md](https://github.com/cruxprotocol/js-sdk/blob/master/error-handling.md) for more information on Error handling.


## 3. Start Using!
```
    // Resolve any existing CRUX ID for a currency
    cruxClient.resolveCurrencyAddressForCruxID('ankit@zel.crux','btc').then((address) => {
        console.log(address);
    })


    // Create a new CRUX ID - foo@testwallet.crux
    cruxClient.registerCruxID('foo').then((result) => {
        console.log(result);
        // ID Will be owned by the injected private key
        // New IDs take 6-8 confirmations in the Bitcoin network to confirm.
    })



    // You can check the status of the ID by asking the SDK for the CruxID State
    cruxClient.getCruxIDState().then((cruxIDState) => {
        console.log(cruxIDState);
    })



    // A registered ID allows you to associate cryptocurrency addresses
    cruxClient.putAddressMap({
        'btc': {
            'addressHash':'1z2...42a'
        }, 
        'eth' {
            'addressHash':'0x12z2...2d'
        }
    })
```

# SDK Integration Steps and User Interface:

[LINK](https://docs.cruxpay.com/docs/integration-dev-plan)

# Sample Integration Code

```bash
npm run wallet_demo
```
Running the above command will build a [demo page](https://localhost:1234), here you can play around with all method that are exposed by the sdk.


# SDK Reference

Find references to all available methods at [https://cruxprotocol.github.io/js-sdk](https://cruxprotocol.github.io/js-sdk).

