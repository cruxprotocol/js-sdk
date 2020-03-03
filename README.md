# CruxPay Official Documentation

[https://docs.cruxpay.com](https://docs.cruxpay.com)

[Sample JS fiddle](https://jsfiddle.net/bxu0Le2n/2/)

## 1. Install

Javascript platforms - 
Web, Electron

Install via `npm`: `npm install @cruxpay/js-sdk`
or include directly as a script - 
`<script src="https://unpkg.com/@cruxpay/js-sdk/dist/cruxpay-sdk-dom.js"/>`


## 2. Initialize:

To initialise the SDK you need a walletClientName.

You can get create and manage your walletClientName at [CRUX Wallet Dashboard](https://cruxpay.com/wallet/dashboard). Please feel free to contact us at contact@cruxpay.com for any registration related queries.

```
    import { CruxPay } from "@cruxpay/js-sdk";

    let cruxClient = new CruxPay.CruxClient({
        walletClientName: 'testwallet',
        privateKey: "6bd397dc89272e71165a0e7d197b288ed5b1e44e1928c25455506f1968f" 
    });

    // Some operations require a privateKey to be injected - like registering a CRUX ID
    // For clients using HD derivation paths, recommended to use the path (m/889'/0'/0') for CRUX keypair derivation.
```


## 3. Start Using!
```
    // Resolve any existing CRUX ID for a currency
    cruxClient.resolveCurrencyAddressForCruxID('ankit@zel.crux','btc').then((address) => {
        console.log(address);
    })


    // Create a new CRUX ID - foo123@testwallet.crux
    cruxClient.registerCruxID('foo123').then((result) => {
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

**Note:** Cruxprotocol JS SDK is case insensitive for cryptocurrency symbols and will always output lowercase symbols.

# SDK Integration Steps and User Interface:

[https://docs.cruxpay.com/docs/integration-dev-plan](https://docs.cruxpay.com/docs/integration-dev-plan)

# Sample Integration Code

```bash
npm run wallet_demo
```
Running the above command will build a [demo page](https://localhost:1234?key=6bd397dc89272e71165a0e7d197b288ed5b1e44e1928c25455506f1968f), here you can play around with all method that are exposed by the sdk.


# SDK Reference

Find references to all available methods at [https://cruxprotocol.github.io/js-sdk](https://cruxprotocol.github.io/js-sdk/cruxwalletclient.html).

