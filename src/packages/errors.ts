
export class ClientError extends Error {
    public error_code: number;
    constructor(message?: string, code?: number) {
        super(message);
        this.message = message || "";
        this.name = "ClientError";
        this.error_code = code || 1000;
    }
}

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

3000s: Subdomain registrar errors
3001 - Subdomain registration failed
*/
class AddressNotAvailable extends ClientError {
    constructor(message?: string, error_code?: number) {
        super(message);
        this.message = message || "";
        this.name = "AddressNotAvailable";
        this.error_code = error_code || 1103;
    }
}

class UserDoesNotExist extends ClientError {
    constructor(message?: string, error_code?: number) {
        super(message);
        this.message = message || "";
        this.name = "UserDoesNotExist";
        this.error_code = error_code || 1037;
    }
}

class BnsResolutionFailed extends ClientError {
    public nodeUrl: string;
    constructor(nodeUrl: string, message?: string, error_code?: number) {
        super(message);
        this.nodeUrl = nodeUrl;
        this.message = message || "";
        this.name = "BnsResolutionFailed";
        this.error_code = error_code || 1004;
    }
}

class NameIntegrityCheckFailed extends ClientError {
    constructor(message?: string, error_code?: number) {
        super(message);
        this.message = message || "";
        this.name = "NameIntegrityCheckFailed";
        this.error_code = error_code || 1100;
    }
}

class GaiaUploadFailed extends ClientError {
    constructor(message?: string, error_code?: number) {
        super(message);
        this.message = message || "";
        this.name = "GaiaUploadFailed";
        this.error_code = error_code || 9991;
    }
}

class GaiaGetFileFailed extends ClientError {
    constructor(message?: string, error_code?: number) {
        super(message);
        this.message = message || "";
        this.name = "GaiaGetFileFailed";
        this.error_code = error_code || 9991;
    }
}

class TokenVerificationFailed extends ClientError {
    constructor(message?: string, error_code?: number) {
        super(message);
        this.message = message || "";
        this.name = "TokenVerificationFailed";
        this.error_code = error_code || 2016;
    }
}

class RegisterSubdomainFailed extends ClientError {
    constructor(message?: string, error_code?: number) {
        super(message);
        this.message = message || "";
        this.name = "RegisterSubdomainFailed";
        this.error_code = error_code || 3001;
    }
}

class AssetIDNotAvailable extends ClientError {
    constructor(message?: string, error_code?: number) {
        super(message);
        this.message = message || "";
        this.name = "AssetIDNotAvailable";
        this.error_code = error_code || 1200;
    }
}

class DecryptionFailed extends ClientError {
    constructor(message?: string, error_code?: number) {
        super(message);
        this.message = message || "";
        this.name = "DecryptionFailed";
        this.error_code = error_code || 1300;
    }
}

export class ClientErrors {
    public static AddressNotAvailable = AddressNotAvailable;
    public static UserDoesNotExist = UserDoesNotExist;
    public static BnsResolutionFailed = BnsResolutionFailed;
    public static NameIntegrityCheckFailed = NameIntegrityCheckFailed;
    public static GaiaUploadFailed = GaiaUploadFailed;
    public static TokenVerificationFailed = TokenVerificationFailed;
    public static GaiaGetFileFailed = GaiaGetFileFailed;
    public static RegisterSubdomainFailed = RegisterSubdomainFailed;
    public static AssetIDNotAvailable = AssetIDNotAvailable;
    public static DecryptionFailed = DecryptionFailed;
}
