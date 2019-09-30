import {PackageError} from "./package-error";

export class CruxClientError extends Error {

    public static FALLBACK_ERROR_CODE: number = 9000;

    public static fromError(error: CruxClientError | PackageError | Error | string, messagePrefix?: string): CruxClientError {

        const msgPrefix: string = messagePrefix === undefined ? "" : messagePrefix + " : ";
        if (error instanceof CruxClientError) {
            if (error.message !== undefined) {
                error.message = msgPrefix + error.message;
            }
            return error;
        }  else if (error instanceof PackageError) {
            return new CruxClientError(msgPrefix + error.message, error.errorCode);
        } else if (typeof (error) === "string") {
            return new CruxClientError(msgPrefix + error);
        } else if (error instanceof Error) {
            return new CruxClientError(msgPrefix + error.message);
        } else {
            throw new Error(`Wrong instance type: ${typeof (error)}`);
        }
    }
    public errorCode: number;

    constructor(errorMessage: string, errorCode?: number | undefined) {
        const message = errorMessage || "";
        super(message);
        this.errorCode = errorCode || CruxClientError.FALLBACK_ERROR_CODE;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
