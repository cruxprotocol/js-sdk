### What is CruxPay?

[CruxPay](https://cruxpay.com/) is a protocol which aims to link any blockchain address to a human-readable name, and let users interact with each other and dApps with ease.


### Adding cruxpay-sdk.js 

First you need to get cruxpay sdk into your project. This can be done using the following methods:

- npm: ``npm install @cruxpay/js-sdk``
- pure js: link the [cruxpay-sdk-dom.js](https://unpkg.com/@cruxpay/js-sdk/dist/cruxpay-sdk-dom.js)


### SDK Initialisation: 
To initialize the sdk, you need to minimally pass a javascript object with following details:-
1. **getEncryptionKey**
    - function reference that return a **constant string** which will be used to encrypt all data that is stored in localStorage. 
    - This should change for each user, so we recommend it is related to user’s password like a sha256 hash of it. 
    - For example check `getPassHashedEncryptionKey` function in code example below.
2. **walletClientName**
    - walletClientName is the key which identifies the wallet specific configurations stored in gaiaHub like 
        1. Subdomain Registrar Information
        2. BNS(BlockStack Name Service) Node
        3. Currency symbol map of your wallet
    - To help you get started, you can use `cruxdev` as the value which is already configured for our dev test users. It has 5 pre-registered crypto symbols for a fast start. You can contact us at [telegram](https://t.me/cruxpay_integration) channel for registration of your own walletClientName.

`**Note:** Cruxprotocol JS SDK is case insensetive for cryptocurrency symbols and will always output lowercase symbols.`

Example below shows how to a cruxClient instance. Note that all [SDK Operation](#sdk-operation) can oly be run after `.init()` is called.   
```javascript
import crypto from "crypto";

function getPassHashedEncryptionKey() {
    let user_password = getUserPassword();  // to be implemented by wallet
    return crypto.createHash('sha256').update(user_password).digest();
}

let cruxClientOptions = {
    getEncryptionKey: getPassHashedEncryptionKey,     
    walletClientName: 'cruxdev'
}

let cruxClient = new CruxClient(cruxClientOptions);
cruxClient.init()
.then(() => {
    console.log('CruxClient initialized');
}).catch((err) => {
    console.log('CruxClient error', err);
})
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

2. ##### getAssetMapping()
    - Description: Get Wallet's asset map with currency symbols as the keys and asset object as the value.
    - Params: None
    - Returns: [IResolvedClientAssetMapping](#iresolvedclientassetmapping) which has symbols and asset objects.

3. ##### registerCruxID(cruxID<onlySubdomain>, newAddressMap)
    - Description: Reserves/registers the cruxID for the user. The user can link any blockchain address to his CruxID with the help of newAddressMap sent. The addresses are now publicly linked and can be resolved.
    - Note: To get which currencies can be part of newAddressMap please call `getAssetMapping()`.
    - Params:
        - subdomain part of [CruxID](#cruxid)
        - newAddressMap of type [IAddressMapping](#iaddressmapping) which has symbols and addresses a user wants to publically expose with CruxID.
    - Returns: Promise resolving to {success: [], failures: [IPutAddressMapFailures](#iputaddressmapfailures)}
    
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
        - change list of publicly accessible currency addresses.
        - change the value of addressHash and/or secIdentifier to another one.
    - Note: To get which currencies can be part of newAddressMap please call `getAssetMapping()`.
    - Params:
        - newAddressMap of type [IAddressMapping](#iaddressmapping) has modified map has symbols and addresses a user wants to publically expose with CruxID.
    - Returns: Promise resolving to {success: [], failures: [IPutAddressMapFailures](#iputaddressmapfailures)}

7. ##### getCruxIDState()
    - Description: Returns details of the current registered CruxID(if any) for this instance of the user wallet and its registration status
    - Params: None
    - Returns: Promise resolving to [CruxIDState](#cruxidstate)
    
8. ##### updatePassword(oldEncryptionKey, newEncryptionKey)
    - Description: As all the values were encrypted by the string we got from getEncryptionKey. Whenever the user changes his password. This function needs to be called so all data is re-encrypted.
    - Params:
        - oldEncryptionKey => hash returned by getEncryptionKey before password changed.
        - newEncryptionKey => hash returned by getEncryptionKey after password changed.
    - Returns: Promise resolving to _boolean_ indicating successful password updation.


### SDK Object Definition


1. ##### CruxID
    - Example: `devtest@cruxdev.crux`
    - Type: String
    - Description: User’s unique human readable ID, created by the wallet using the sdk. In the above example (`devtest@cruxdev.crux`), `devtest` is subdomain part of CruxID and `cruxdev` is the domain part of CruxID.

2. ##### CruxIDRegistrationStatus
    - Example:
        ```
        {
            status: "PENDING",
            statusDetail: "Your subdomain was registered in transaction"
        }
        ```
    - Type: javascript object
    - Description: Defines the status in the registration process of the CruxID. It has 2 subcomponent.
        - status: 
            - Type: string
            - Description: which can have the following values [UNKNOWN, PENDING, REJECTED, DONE]
        - statusDetail:
            - Type: string
            - Description: which contains further details/reason about the status.

3. ##### CruxIDState
    
    - Example:
    ```
    {
       cruxID: <CruxID>,
       registration_status: <CruxIDRegistrationStatus>
    }
    ```
    - Type: javascript object
    - Description: Return the current registered ID and its status.

4. ##### IAddress
    - Example:
    ```
    {
       addressHash: string,
       secIdentifier: string, # optional
    }
    ```
    - Type: javascript object
    - Description: Address object. Here, **secIdentifier** is an optional field and can be skipped or sent as empty string if not required by blockchain or blockchain supports yet you don’t want to add it.

5. ##### walletCurrencySymbol

    - Type: String
    - Description: Wallet’s currency symbol for any crypto.

6. ##### IAddressMapping

    - Example: 
    ```
    {
        'BTC': {
            addressHash: '1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX'
        },
        'ETH': {
            addressHash: '0x7cB57B5A97eAbe94205C07890BE4c1aD31E486A8'
        },
        'XLM': {
            addressHash: 'GA2XP4KMY4KWNPW4KUCUKYUF2J7Y6HO5HLPUEA3VPVSMYCM3TGNEZP5S',
        },
        'EOS': {
            addressHash: 'cocoinswitch',
            secIdentifier: '108660'    
        }
    }
    ```
    - Type: javascript object
    - Description: Map of [walletCurrencySymbol](#walletcurrencysymbol) to [IAddress](#iaddress). You can see in above example, the exchange can skip secIdentifier for currency with memo/tag if it so desires(like its done for XLM above).

7. ##### IGlobalAsset
    - Example:
    ```
    {
        "assetId":"d79b9ece-a918-4523-b2bc-74071675b54a",
        "symbol":"ltc",
        "name":"Litecoin",
        "assetType":null,
        "decimals":8,
        "assetIdentifierName":null,
        "assetIdentifierValue":null,
        "parentAssetId":null
    }
    ```
    - Type: javascript object
    - Description: Asset object. Describing properties of asset.

8. ##### IResolvedClientAssetMapping

    - Example: 
    ```
    {
        'ltc': {
            "assetId":"d79b9ece-a918-4523-b2bc-74071675b54a",
            "symbol":"ltc",
            "name":"Litecoin",
            "assetType":null,
            "decimals":8,
            "assetIdentifierName":null,
            "assetIdentifierValue":null,
            "parentAssetId":null
        },
        'btc': {
            "assetId":"d78c26f8-7c13-4909-bf62-57d7623f8ee8",
            "symbol":"btc",
            "name":"Bitcoin",
            "assetType":null,
            "decimals":8,
            "assetIdentifierName":null,
            "assetIdentifierValue":null,
            "parentAssetId":null
        },
    }
    ```
    - Type: javascript object
    - Description: Map of [walletCurrencySymbol](#walletcurrencysymbol) to [IGlobalAsset](#iglobalasset).

9. ##### IPutAddressMapFailures
    - Example:
    ```
    {
        "monero": "4011: Currency does not exist in wallet's client mapping"
    }
    ```


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


### How can I contribute?

See [CONTRIBUTING.md](CONTRIBUTING.md) file.