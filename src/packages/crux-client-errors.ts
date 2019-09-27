import {PackageError} from "./errors";

class CruxClientError extends Error {

    public static FALLBACK_ERROR_CODE: number = 9000;
    public static FALLBACK_ERROR_NAME: string = "CruxClientError";

    public static fromError(error: CruxClientError | PackageError | Error | string, messagePrefix?: string): CruxClientError {

        const msgPrefix: string = messagePrefix === undefined ? "" : messagePrefix + " : ";
        if (error instanceof CruxClientError) {
            if (error.message !== undefined) {
                error.message = msgPrefix + error.message;
            }
            return error;
        } else if (typeof (error) === "string") {
            return new CruxClientError(msgPrefix + error);
        } else if (error instanceof PackageError) {
            return new CruxClientError(msgPrefix + error.message, error.error_code);
        } else if (error instanceof Error) {
            return new CruxClientError(msgPrefix + error.message);
        } else {
            throw new Error(`Wrong instance type: ${typeof (error)}`);
        }
    }
    public error_code: number;

    constructor(error_message: string, error_code?: number | undefined) {
        const message = error_message || "";
        super(message);
        this.name = CruxClientError.FALLBACK_ERROR_NAME;
        this.error_code = error_code || CruxClientError.FALLBACK_ERROR_CODE;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export enum CruxClientErrorNames {
    FAILED_TO_REGISTER_CRUX_ID = "FAILED_TO_REGISTER_CRUX_ID",
    FAILED_TO_CHECK_CRUX_ID_AVAILABLE = "FAILED_TO_CHECK_CRUX_ID_AVAILABLE",
    FAILED_TO_RESOLVE_CURRENCY_ADDRESS_FOR_CRUX_ID = "FAILED_TO_RESOLVE_CURRENCY_ADDRESS_FOR_CRUX_ID",
    FAILED_TO_GET_ADDRESS_MAP = "FAILED_TO_GET_ADDRESS_MAP",
    FAILED_TO_PUT_ADDRESS_MAP = "FAILED_TO_PUT_ADDRESS_MAP",
    FAILED_TO_GET_CRUX_ID_STATE = "FAILED_TO_GET_CRUX_ID_STATE",
    FAILED_TO_UPDATE_PASSWORD = "FAILED_TO_UPDATE_PASSWORD",
}

class FailedToCheckCruxIDAvailableError extends CruxClientError {

    public static FALLBACK_ERROR_CODE: number = 9001;
    public static FALLBACK_ERROR_NAME: string = CruxClientErrorNames.FAILED_TO_CHECK_CRUX_ID_AVAILABLE;

    constructor(error_message: string, error_code?: number | undefined) {
        super(error_message, error_code);
        this.name = FailedToCheckCruxIDAvailableError.FALLBACK_ERROR_NAME;
        this.error_code = FailedToCheckCruxIDAvailableError.FALLBACK_ERROR_CODE;
    }
}

class FailedToRegisterCruxIDError extends CruxClientError {

    public static FALLBACK_ERROR_CODE: number = 9002;
    public static FALLBACK_ERROR_NAME: string = CruxClientErrorNames.FAILED_TO_REGISTER_CRUX_ID;

    constructor(error_message: string, error_code?: number | undefined) {
        super(error_message, error_code);
        this.name = FailedToRegisterCruxIDError.FALLBACK_ERROR_NAME;
        this.error_code = FailedToRegisterCruxIDError.FALLBACK_ERROR_CODE;
    }
}

class FailedToResolveCurrencyAddressForCruxIDError extends CruxClientError {

    public static FALLBACK_ERROR_CODE: number = 9003;
    public static FALLBACK_ERROR_NAME: string = CruxClientErrorNames.FAILED_TO_RESOLVE_CURRENCY_ADDRESS_FOR_CRUX_ID;

    constructor(error_message: string, error_code?: number | undefined) {
        super(error_message, error_code);
        this.name = FailedToResolveCurrencyAddressForCruxIDError.FALLBACK_ERROR_NAME;
        this.error_code = FailedToResolveCurrencyAddressForCruxIDError.FALLBACK_ERROR_CODE;
    }
}

class FailedToGetAddressMapError extends CruxClientError {

    public static FALLBACK_ERROR_CODE: number = 9004;
    public static FALLBACK_ERROR_NAME: string = CruxClientErrorNames.FAILED_TO_GET_ADDRESS_MAP;

    constructor(error_message: string, error_code?: number | undefined) {
        super(error_message, error_code);
        this.name = FailedToGetAddressMapError.FALLBACK_ERROR_NAME;
        this.error_code = FailedToGetAddressMapError.FALLBACK_ERROR_CODE;
    }
}

class FailedToPutAddressMapError extends CruxClientError {

    public static FALLBACK_ERROR_CODE: number = 9005;
    public static FALLBACK_ERROR_NAME: string = CruxClientErrorNames.FAILED_TO_PUT_ADDRESS_MAP;

    constructor(error_message: string, error_code?: number | undefined) {
        super(error_message, error_code);
        this.name = FailedToPutAddressMapError.FALLBACK_ERROR_NAME;
        this.error_code = FailedToPutAddressMapError.FALLBACK_ERROR_CODE;
    }
}

class FailedToGetCruxIDStateError extends CruxClientError {

    public static FALLBACK_ERROR_CODE: number = 9006;
    public static FALLBACK_ERROR_NAME: string = CruxClientErrorNames.FAILED_TO_GET_CRUX_ID_STATE;

    constructor(error_message: string, error_code?: number | undefined) {
        super(error_message, error_code);
        this.name = FailedToGetCruxIDStateError.FALLBACK_ERROR_NAME;
        this.error_code = FailedToGetCruxIDStateError.FALLBACK_ERROR_CODE;
    }
}

class FailedUpdatePasswordError extends CruxClientError {

    public static FALLBACK_ERROR_CODE: number = 9007;
    public static FALLBACK_ERROR_NAME: string = CruxClientErrorNames.FAILED_TO_UPDATE_PASSWORD;

    constructor(error_message: string, error_code?: number | undefined) {
        super(error_message, error_code);
        this.name = FailedUpdatePasswordError.FALLBACK_ERROR_NAME;
        this.error_code = FailedUpdatePasswordError.FALLBACK_ERROR_CODE;
    }
}

export {
    FailedToCheckCruxIDAvailableError,
    FailedToRegisterCruxIDError,
    FailedToResolveCurrencyAddressForCruxIDError,
    FailedToGetAddressMapError,
    FailedToPutAddressMapError,
    FailedToGetCruxIDStateError,
    FailedUpdatePasswordError,
    CruxClientError,
};
