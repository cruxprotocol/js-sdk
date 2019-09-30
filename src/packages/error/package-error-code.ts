export enum PackageErrorCode {
    // 1000s: NameService errors
    BnsResolutionFailed = 1004,
    UserDoesNotExist = 1037,
    NameIntegrityCheckFailed = 1100,
    BnsEmptyData = 1101,
    AddressNotAvailable = 1103,
    AssetIDNotAvailable = 1200,
    DecryptionFailed = 1300,
    // 2000s: Gaia errors
    GaiaUploadFailed = 2001,
    GaiaCruxPayUploadFailed = 2002,
    GaiaClientConfigUploadFailed = 2003,
    GaiaAssetListUploadFailed = 2004,
    GaiaGetFileFailed = 2105,
    TokenVerificationFailed = 2106,
    GaiaEmptyResponse = 2107,
    // 3000s: Registry errors
    SubdomainRegistrationFailed = 3001,
    SubdomainRegistrationAcknowledgementFailed = 3002,
    // Validating user input errors
    ExpectedEncryptionKeyValue = 4001,
    SubdomainRegexMatchFailure = 4002,
    SubdomainLengthCheckFailure = 4003,
    AddressMappingDecodingFailure = 4004,
    // Internal errors
    CouldNotFindBlockstackConfigurationServiceClientConfig = 5001,
    CouldNotFindMnemonicToRestoreIdentity = 5002,
    CouldNotValidateZoneFile = 5003,
    CouldNotFindIdentityKeyPairToPutAddressMapping = 5004,
}
