
export class PackageError extends Error {
    public error_code: number;
    constructor(message?: string, code?: number) {
        super(message);
        this.message = message || "";
        this.name = "ClientError";
        this.error_code = code || 1000;
        Object.setPrototypeOf(this, new.target.prototype);
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
class AddressNotAvailable extends PackageError {
    constructor(message?: string, error_code?: number) {
        let code = error_code || 1103;
        super(message, code);
        this.name = "AddressNotAvailable";
    }
}

class UserDoesNotExist extends PackageError {
    constructor(message?: string, error_code?: number) {
        let code = error_code || 1037;
        super(message, code);
        this.name = "UserDoesNotExist";
    }
}

class BnsResolutionFailed extends PackageError {
    public nodeUrl: string;
    constructor(nodeUrl: string, message?: string, error_code?: number) {
        let code = error_code || 1004;
        super(message, code);
        this.nodeUrl = nodeUrl;
        this.name = "BnsResolutionFailed";
    }
}

class NameIntegrityCheckFailed extends PackageError {
    constructor(message?: string, error_code?: number) {
        let code = error_code || 1100;
        super(message, code);
        this.name = "NameIntegrityCheckFailed";
    }
}

class GaiaUploadFailed extends PackageError {
    constructor(message?: string, error_code?: number) {
        let code = error_code || 2005;
        super(message, code);
        this.name = "GaiaUploadFailed";
    }
}

class GaiaGetFileFailed extends PackageError {
    constructor(message?: string, error_code?: number) {
        let code = error_code || 2105;
        super(message, code);
        this.name = "GaiaGetFileFailed";
    }
}

class TokenVerificationFailed extends PackageError {
    constructor(message?: string, error_code?: number) {
        let code = error_code || 2016;
        super(message, code);
        this.name = "TokenVerificationFailed";
    }
}

class RegisterSubdomainFailed extends PackageError {
    constructor(message?: string, error_code?: number) {
        let code = error_code || 3001;
        super(message, code);
        this.name = "RegisterSubdomainFailed";
    }
}

class AssetIDNotAvailable extends PackageError {
    constructor(message?: string, error_code?: number) {
        let code = error_code || 1200;
        super(message, code);
        this.name = 'AssetIDNotAvailable';
    }
}

class DecryptionFailed extends PackageError {
    constructor(message?: string, error_code?: number) {
        let code = error_code || 1300;
        super(message, code);
        this.name = "DecryptionFailed";
    }
}

export class PackageErrors {
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
