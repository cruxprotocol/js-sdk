import {PackageErrorCode} from "./package-error-code";

export const ERROR_STRINGS = {
    [PackageErrorCode.AddressMappingDecodingFailure]: "AddressMapping decoding failure",
    [PackageErrorCode.AddressNotAvailable]: "Currency address not available for user",
    [PackageErrorCode.AssetIDNotAvailable]: "AssetID doesn\'t exist in client mapping",
    [PackageErrorCode.BlockstackIdInvalidStructure]: "Invalid Blockstack ID namespace: '{0}', should end with .id",
    [PackageErrorCode.BlockstackIdInvalidSubdomainForTranslation]: "Invalid Blockstack ID, subdomain must be non null to be translated",
    [PackageErrorCode.BlockstackIdInvalidDomainForTranslation]: "Only Blockstack Domains ending with _crux can be translated",
    [PackageErrorCode.BlockstackIdNamespaceValidation]: "Invalid Blockstack ID",
    [PackageErrorCode.BnsEmptyData]: "No name data available",
    [PackageErrorCode.BnsResolutionFailed]: "'{0}' node not available because '{1}'",
    [PackageErrorCode.CouldNotFindAssetListInClientConfig]: "Missing global asset list",
    [PackageErrorCode.CouldNotFindBlockstackConfigurationServiceClientConfig]: "Missing client-config for: '{0}'",
    [PackageErrorCode.CouldNotFindIdentityKeyPairToPutAddressMapping]: "Missing IdentityKeyPair",
    [PackageErrorCode.CouldNotFindKeyPairToRestoreIdentity]: "Require mnemonic for restoring the identity",
    [PackageErrorCode.CouldNotFindKeyPairToRegisterName]: "Require mnemonic for registering name/subdomain",
    [PackageErrorCode.CouldNotValidateZoneFile]: "Invalid zonefile",
    [PackageErrorCode.CruxIdNamespaceValidation]: "Invalid Crux ID namespace: '{0}', should end with .crux",
    [PackageErrorCode.CruxIdInvalidStructure]: "Invalid Crux ID",
    [PackageErrorCode.DecryptionFailed]: "Decryption failed",
    [PackageErrorCode.ExpectedEncryptionKeyValue]: "Missing encryptionKey method",
    [PackageErrorCode.GaiaClientConfigUploadFailed]: "Unable to upload '{0}' to gaia: '{1}'",
    [PackageErrorCode.GaiaCruxPayUploadFailed]: "Unable to upload '{0}' to gaia: '{1}'",
    [PackageErrorCode.GaiaEmptyResponse]: "Gaia sent empty response",
    [PackageErrorCode.GaiaCruxPayGetFailed]: "Unable to get gaia read url prefix: '{0}'",
    [PackageErrorCode.GaiaClientConfigGetFailed]: "Unable to get gaia read url prefix: '{0}'",
    [PackageErrorCode.GaiaGetFileFailed]: "Unable to get gaia read url prefix: '{0}'",
    [PackageErrorCode.GaiaProfileUploadFailed]: "Unable to upload '{0}' to gaia: '{1}'",
    [PackageErrorCode.GaiaUploadFailed]: "Unable to upload '{0}' to gaia: '{1}'",
    [PackageErrorCode.GetNamesByAddressFailed]: "'{0}' failed with error '{1}'",
    [PackageErrorCode.KeyPairMismatch]: "Invalid keyPair provided",
    [PackageErrorCode.NameIntegrityCheckFailed]: "Name resolution integrity check failed",
    [PackageErrorCode.SubdomainLengthCheckFailure]: "Validation failed: Subdomain length must be between 4 to 20",
    [PackageErrorCode.SubdomainRegexMatchFailure]: "Validation failed: Subdomain should start with alphabet and end with alphabet or number. Allowed characters are lowercase alphabets, numbers, - and _",
    [PackageErrorCode.SubdomainRegistrationAcknowledgementFailed]: "Register call to registrar failed: '{0}'",
    [PackageErrorCode.SubdomainRegistrationFailed]: "Register call to registrar failed: '{0}'",
    [PackageErrorCode.TokenVerificationFailed]: "Token verification failed for '{0}'",
    [PackageErrorCode.UserDoesNotExist]: "ID does not exist",
    [PackageErrorCode.IdentityMismatch]: "Identity mismatch",
    [PackageErrorCode.CurrencyDoesNotExistInClientMapping]: "Currency does not exist in wallet's client mapping",
};
