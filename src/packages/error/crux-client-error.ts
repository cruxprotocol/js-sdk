import {PackageError} from "./package-error";

export class CruxClientError extends Error {

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
            return new CruxClientError(msgPrefix + error.message, error.errorCode);
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
