import {PackageErrorCode} from "./package-error-code";

export const ERROR_STRINGS = {
    [PackageErrorCode.SubdomainRegistrationFailed]: "Register call to registrar failed",
    [PackageErrorCode.DecryptionFailed]: "Decryption failed",
    [PackageErrorCode.AssetIDNotAvailable]: "AssetID doesn\'t exist in client mapping",
    [PackageErrorCode.GaiaGetFileFailed]: "Unable to get gaia read url prefix: '{0}'",
    [PackageErrorCode.TokenVerificationFailed]: "Token verification failed for '{0}'",
    [PackageErrorCode.GaiaUploadFailed]: "Unable to upload '{0}' to gaia: '{1}'",
    [PackageErrorCode.NameIntegrityCheckFailed]: "Name resolution integrity check failed",
    [PackageErrorCode.BnsResolutionFailed]: "'{0}' node not available because '{1}'",
    [PackageErrorCode.UserDoesNotExist]: "ID does not exist",
    [PackageErrorCode.AddressNotAvailable]: "Currency address not available for user",
    [PackageErrorCode.ExpectedEncryptionKeyValue]: "Missing encryptionKey method",
    [PackageErrorCode.CouldNotFindBlockstackConfigurationServiceClientConfig]: "Missing client-config for: '{0}'",
    [PackageErrorCode.SubdomainRegexMatchFailure]: "Validation failed: Subdomain should start with alphabet and end with alphabet or number. Allowed characters are lowercase alphabets, numbers, - and _",
    [PackageErrorCode.SubdomainLengthCheckFailure]: "Validation failed: Subdomain length must be between 4 to 20",
    [PackageErrorCode.CouldNotFindMnemonicToRestoreIdentity]: "Require mnemonic for restoring the identity",
    [PackageErrorCode.BnsEmptyData]: "No name data available",
    [PackageErrorCode.CouldNotValidateZoneFile]: "Invalid zonefile",
    [PackageErrorCode.CouldNotFindIdentityKeyPairToPutAddressMapping]: "Missing IdentityKeyPair",
    [PackageErrorCode.SubdomainRegistrationAcknowledgementFailed]: "Register call to registrar failed: '{0}'",
};
