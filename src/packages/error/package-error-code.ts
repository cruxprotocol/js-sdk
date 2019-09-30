export enum PackageErrorCode {
    // 1000s: NameService errors
    BnsResolutionFailed = 1001,
    UserDoesNotExist = 1002,
    NameIntegrityCheckFailed = 1003,
    BnsEmptyData = 1004,
    AddressNotAvailable = 1005,
    AssetIDNotAvailable = 1006,
    DecryptionFailed = 1007,
    // 2000s: Gaia errors
    GaiaUploadFailed = 2001,
    GaiaCruxPayUploadFailed = 2002,
    GaiaClientConfigUploadFailed = 2003,
    GaiaAssetListUploadFailed = 2004,
    GaiaProfileUploadFailed = 2004,
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
    CruxIdNamespaceValidation = 4005,
    CruxIdLengthValidation = 4006,
    BlockstackIdNamespaceValidation = 4007,
    BlockstackIdLengthValidation = 4008,
    BlockstackIdInvalidSubdomain = 4009,
    // Internal errors
    CouldNotFindBlockstackConfigurationServiceClientConfig = 5001,
    CouldNotFindMnemonicToRestoreIdentity = 5002,
    CouldNotValidateZoneFile = 5003,
    CouldNotFindIdentityKeyPairToPutAddressMapping = 5004,
}
