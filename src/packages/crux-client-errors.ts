import {PackageError} from "./errors"

export class CruxClientError extends Error {

    public static FALLBACK_ERROR_CODE: number = 9000;
    public static FALLBACK_ERROR_NAME: string = "CruxClientError";
    public error_code: number;

    constructor(error_message: string, error_code?: number | undefined) {
        let message = error_message || "";
        super(message);
        this.name = CruxClientError.FALLBACK_ERROR_NAME;
        this.error_code = error_code || CruxClientError.FALLBACK_ERROR_CODE;
        Object.setPrototypeOf(this, new.target.prototype);
    }

    public static fromError(error: CruxClientError | PackageError | Error | string, messagePrefix?: string): CruxClientError {

        const msgPrefix: string = messagePrefix === undefined ? '' : messagePrefix + ' : ';
        if (error instanceof CruxClientError) {
            if (error.message !== undefined) {
                error.message = msgPrefix + error.message;
            }
            return error;
        } else if (typeof (error) === 'string') {
            return new CruxClientError(msgPrefix + error);
        } else if (error instanceof PackageError) {
            return new CruxClientError(msgPrefix + error.message, error.error_code);
        } else if (error instanceof Error) {
            return new CruxClientError(msgPrefix + error.message);
        } else {
            throw new Error(`Wrong instance type: ${typeof (error)}`);
        }
    }
}

export namespace CruxClientErrorNames {
    export const FAILED_TO_REGISTER_CRUX_ID: string = 'FAILED_TO_REGISTER_CRUX_ID';
    export const FAILED_TO_CHECK_CRUX_ID_AVAILABLE: string = 'FAILED_TO_CHECK_CRUX_ID_AVAILABLE';
    export const FAILED_TO_RESOLVE_CURRENCY_ADDRESS_FOR_CRUX_ID: string = 'FAILED_TO_RESOLVE_CURRENCY_ADDRESS_FOR_CRUX_ID';
    export const FAILED_TO_GET_ADDRESS_MAP: string = 'FAILED_TO_GET_ADDRESS_MAP';
    export const FAILED_TO_PUT_ADDRESS_MAP: string = 'FAILED_TO_PUT_ADDRESS_MAP';
    export const FAILED_TO_GET_CRUX_ID_STATE: string = 'FAILED_TO_GET_CRUX_ID_STATE';
    export const FAILED_TO_UPDATE_PASSWORD: string = 'FAILED_TO_UPDATE_PASSWORD';
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

export class CruxClientErrors {
    public static FailedToCheckCruxIDAvailableError = FailedToCheckCruxIDAvailableError;
    public static FailedToRegisterCruxIDError = FailedToRegisterCruxIDError;
    public static FailedToResolveCurrencyAddressForCruxIDError = FailedToResolveCurrencyAddressForCruxIDError;
    public static FailedToGetAddressMapError = FailedToGetAddressMapError;
    public static FailedToPutAddressMapError = FailedToPutAddressMapError;
    public static FailedToGetCruxIDStateError = FailedToGetCruxIDStateError;
    public static FailedUpdatePasswordError = FailedUpdatePasswordError;
    public static CruxClientError = CruxClientError;
}