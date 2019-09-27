/*
1000s: Name & address resolution errors
1103 - Currency address not available for user
1037 - User doesn't exist!
1004 - X node not available because ${error}
1100 - Name resolution integrity check failed.
1200 - AssetID not available in client mapping
1300 - Decryption Error so maybe encryption key is wrong.

2000s: Gaia errors
2005 - Content upload to Gaia failed (method - uploadContentToGaiaHub)
2006 - Profile upload to Gaia failed
2006 - Address map upload to Gaia failed
2105 - Cannot get/read file from Gaia
2106 - Cannot get/read address map from Gaia
2107 - Cannot get/read client asset map from Gaia

*/

export enum PackageErrorCode {
    BnsResolutionFailed = 1004,
    UserDoesNotExist = 1037,
    NameIntegrityCheckFailed = 1100,
    AddressNotAvailable = 1103,
    AssetIDNotAvailable = 1200,
    DecryptionFailed = 1300,
    // 2000s: Gaia errors
    GaiaUploadFailed = 2005,
    GaiaGetFileFailed = 2105,
    TokenVerificationFailed = 2106,
    // 3000s: Subdomain registrar errors
    SubdomainRegistrationFailed = 3001,
}
