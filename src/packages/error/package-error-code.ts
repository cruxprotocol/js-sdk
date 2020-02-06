export enum PackageErrorCode {
    // 1000s: NameService errors
    BnsResolutionFailed = 1001,
    UserDoesNotExist = 1002,
    NameIntegrityCheckFailed = 1003,
    BnsEmptyData = 1004,
    AddressNotAvailable = 1005,
    AssetIDNotAvailable = 1006,
    DecryptionFailed = 1007,
    IdentityMismatch = 1008,
    GetNamesByAddressFailed = 1009,
    KeyPairMismatch = 1010,
    DifferentWalletCruxID = 1011,
    GetAddressMapFailed = 1012,
    InvalidWalletClientName = 1013,
    // 2000s: Gaia errors
    GaiaUploadFailed = 2001,
    GaiaCruxPayUploadFailed = 2002,
    GaiaClientConfigUploadFailed = 2003,
    GaiaProfileUploadFailed = 2005,
    GaiaCruxPayGetFailed = 2102,
    GaiaClientConfigGetFailed = 2103,
    GaiaGetFileFailed = 2105,
    TokenVerificationFailed = 2106,
    GaiaEmptyResponse = 2107,
    FailedToGetGaiaUrlFromZonefile = 2018,
    // 3000s: Registry errors
    SubdomainRegistrationFailed = 3001,
    SubdomainRegistrationAcknowledgementFailed = 3002,
    FetchPendingRegistrationsByAddressFailed = 3003,
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
    InvalidBlockstackDomainForTranslation = 4010,
    CurrencyDoesNotExistInClientMapping = 4011,
    ExistingCruxIDFound = 4012,
    CruxIDUnavailable = 4013,
    InvalidPrivateKeyFormat = 4014,
    PrivateKeyRequired = 4015,
    ConfigKeyManagerRequired = 4016,
    CruxDomainInvalidStructure = 4017,
    CruxDomainNamespaceValidation = 4018,
    BlockstackDomainInvalidStructure = 4019,
    BlockstackDomainNamespaceValidation = 4020,
    // Internal errors
    CouldNotFindBlockstackConfigurationServiceClientConfig = 5001,
    CouldNotFindKeyPairToRestoreIdentity = 5002,
    CouldNotValidateZoneFile = 5003,
    CouldNotFindIdentityKeyPairToPutAddressMapping = 5004,
    CouldNotFindAssetListInClientConfig = 5005,
    CouldNotFindKeyPairToRegisterName = 5006,
    ClientNotInitialized = 5007,
    InsecureNetworkCall = 5008,
    MissingCruxDomainInCruxOnBoardingClient = 5009,
    IsNotSupported = 5010,
    MissingCruxDomainInCruxWalletClient = 5011,
    MissingZoneFile = 5012,
    MissingNameOwnerAddress = 5013,
    MissingUserCruxAssetTranslator = 5014,
}
