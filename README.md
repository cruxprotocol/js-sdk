### CruxPay Official Documentation

[https://cruxprotocol.github.io/js-sdk](https://cruxprotocol.github.io/js-sdk)

### What is CruxPay?

[CruxPay](https://cruxpay.com/) is a protocol which aims to link any blockchain address to a human-readable name, and let users interact with each other and dApps with ease.


### Adding cruxpay-sdk.js 

First you need to get cruxpay sdk into your project. This can be done using the following methods:

- npm: ``npm install @cruxpay/js-sdk``
- pure js: link the [cruxpay-sdk-dom.js](https://unpkg.com/@cruxpay/js-sdk/dist/cruxpay-sdk-dom.js)


### SDK Initialisation: 
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


### Building

#### Requirements

* [Node.js](https://nodejs.org)
* npm

#### Building From Source

```bash
npm run-script build
```
Build the cruxpay-sdk.js package and put all the browser build files into the `dist` folder.


#### Testing (mocha)

```bash
npm run-script test
```


### Sample Wallet Integration

```bash
npm run-script wallet_demo
```
Running the above command will build a [demo page](https://localhost:1234), here you can play around with all method that are exposed by the sdk.


### References

Find references to all available methods at [https://cruxprotocol.github.io/js-sdk](https://cruxprotocol.github.io/js-sdk).


### How can I contribute?

See [CONTRIBUTING.md](CONTRIBUTING.md) file.
