All public methods of `CruxClient` throw `CruxClientError` along with a respective `ERROR_CODE`.


```javascript
// --- @crux/js-sdk integration --- //
import {CruxPay} from "@cruxpay/js-sdk";
const {CruxClient, errors} = CruxPay;

// defining cruxClientOptions
let cruxClientOptions: ICruxPayPeerOptions = {
    getEncryptionKey: () => "fooKey",
    walletClientName: "cruxdev"
}

// initialising the cruxClient
let cruxClient = new CruxClient(cruxClientOptions)
cruxClient.init()



// --- ERROR Handling --- //

// 1. Unhandled errors
try {
    let resolvedAddress = await cruxClient.resolveCurrencyAddressForCruxID("sample@cruxdev.crux", "btc");
} catch (error) {
    // Wallet clients are advised to catch `CruxClientError`s by having an `instanceof` check on the caught errors.
    if (error instanceof errors.CruxClientError) {
        // And should showcase the respective ERROR_CODE to the user for better debugging.
        alert(`${e_3.errorCode}: ${e_3.message}`);
    } else {
        throw error;
    }
}

// 2. Handled errors
try {
    let resolvedAddress = await cruxClient.resolveCurrencyAddressForCruxID("sample@cruxdev.crux", "btc");
} catch (error) {
    // Wallet clients are advised to catch `CruxClientError`s by having an `instanceof` check on the caught errors along with a check on the ERROR_CODE to be handled.
    if (error instanceof errors.CruxClientError && error.errorCode === 1002) {
        // Behaviour expected in the event of the respective ERROR_CODE
        alert(`There is no user with the provided CruxID`);
    } else {
        throw error;
    }
}
```

Some common ERROR_CODES thrown by the SDK:
```javascript
{
    // 1000s: NameService errors
    BnsResolutionFailed = 1001,
    UserDoesNotExist = 1002,
    AddressNotAvailable = 1005,
    AssetIDNotAvailable = 1006,
    DecryptionFailed = 1007,
    IdentityMismatch = 1008,
    GetNamesByAddressFailed = 1009,
    KeyPairMismatch = 1010,
    DifferentWalletCruxID = 1011,
    
    // 3000s: Registry errors
    SubdomainRegistrationAcknowledgementFailed = 3002,
    
    // Validating user input errors
    ExpectedEncryptionKeyValue = 4001,
    SubdomainRegexMatchFailure = 4002,
    SubdomainLengthCheckFailure = 4003,
    AddressMappingDecodingFailure = 4004,
    CruxIdNamespaceValidation = 4005,
    CruxIdInvalidStructure = 4006,
    BlockstackIdNamespaceValidation = 4007,
    BlockstackIdInvalidStructure = 4008,
    BlockstackIdInvalidSubdomainForTranslation = 4009,
    BlockstackIdInvalidDomainForTranslation = 4010,
    CurrencyDoesNotExistInClientMapping = 4011,
}
```

For more specific errors, refer to the file: [package-error-code](https://github.com/cruxprotocol/js-sdk/blob/master/src/packages/error/package-error-code.ts)