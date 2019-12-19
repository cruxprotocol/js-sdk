### CruxPay Official Documentation

[https://docs.cruxpay.com](https://docs.cruxpay.com)

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


### SDK Operation

1. ##### isCruxIDAvailable(cruxID<onlySubdomain>)
    - Description: Helps to check if a particular CruxID is available to be registered.
    - Params:
        - subdomain part of [CruxID](#cruxid)
    - Returns: Promise resolving to a _boolean_ indicating whether a particular Crux ID is available for registration.

2. ##### getAssetMap()
    - Description: Get Wallet's asset map with currency symbols as the keys and asset object as the value.
    - Params: None
    - Returns: Promise resolving to [IResolvedClientAssetMapping](#iresolvedclientassetmapping) which has symbols and asset objects.

3. ##### registerCruxID(cruxID<onlySubdomain>)
    - Description: Reserves/registers the cruxID for the user. The user can link any blockchain address to his CruxID immediately after registration using [putAddressMap](#putaddressmap).
    - Params:
        - subdomain part of [CruxID](#cruxid)
    - Returns: Promise resolving on successful call to the registrar.
    ```javascript
    const sampleAddressMap: IAddressMapping = {
        'BTC': {
            addressHash: '1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX'
        },
        'ETH': {
            addressHash: '0x7cB57B5A97eAbe94205C07890BE4c1aD31E486A8'
        },
    }

    // Advised to pipe the method putAddressMap to registerCruxID call

    await cruxClient.registerCruxID("bob")
        .then(() => {
            return cruxClient.putAddressMap(sampleAddressMap)
                .catch((addressUpdationError) => {
                    // Handling addressUpdation error
                })
        })
        .catch((registrationError) => {
            // Handling registration error
        })
    ```
    
4. ##### resolveCurrencyAddressForCruxID(cruxID, walletCurrencySymbol)
    - Description: Helps to lookup a mapped address for a currency of any CruxID if its marked publically accessible.
    - Params:
        - complete [CruxID](#cruxid) of a user whose address you want to fetch
        - [walletCurrencySymbol](#walletcurrencysymbol) wallet symbol of currency whose address you want to fetch.
    - Returns: Promise resolving to [IAddress](#iaddress) for that symbol of currency if available.

5. ##### getAddressMap()
    - Description: Get back the current publicly registered address json 
    - Params: None
    - Returns: Promise resolving to [IAddressMapping](#iaddressmapping)
    
6. ##### putAddressMap(newAddressMap)
    - Description: Helps to update 2 things:-
        - publish/change list of publicly accessible currency addresses.
        - change the value of addressHash and/or secIdentifier to another one.
    - Note: The addresses are now publicly linked and can be resolved. To get which currencies can be part of newAddressMap please call `getAssetMap()`.
    - Params:
        - newAddressMap of type [IAddressMapping](#iaddressmapping) has modified map has symbols and addresses a user wants to publically expose with CruxID.
    - Returns: Promise resolving to {success: [IPutAddressMapSuccess](#iputaddressmapSuccess), failures: [IPutAddressMapFailures](#iputaddressmapfailures)}

7. ##### getCruxIDState()
    - Description: Returns details of the current registered CruxID(if any) for this instance of the user wallet and its registration status
    - Params: None
    - Returns: Promise resolving to [CruxIDState](#cruxidstate)


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
