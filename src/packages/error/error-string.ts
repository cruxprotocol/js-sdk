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
};
