import { CruxBaseError } from "./base-error";
import {PackageError} from "./package-error";

export class CruxClientError extends CruxBaseError {

    public static FALLBACK_ERROR_CODE: number = 9000;

    public static fromError(error: CruxClientError | PackageError | Error | string, messagePrefix?: string): CruxClientError {

        const msgPrefix: string = messagePrefix === undefined ? "" : messagePrefix + " : ";
        if (error instanceof CruxClientError) {
            if (error.message !== undefined) {
                error.message = msgPrefix + error.message;
            }
            return error;
        }  else if (error instanceof PackageError) {
            return new CruxClientError(error, msgPrefix + error.message, error.errorCode);
        } else if (typeof (error) === "string") {
            return new CruxClientError(null, msgPrefix + error);
        } else if (error instanceof Error) {
            return new CruxClientError(error, msgPrefix + error.message);
        } else {
            throw new CruxBaseError(null, `Wrong instance type: ${typeof (error)}`);
        }
    }
    public errorCode: number;

    constructor(cause: Error | null, errorMessage: string, errorCode?: number) {
        const message = errorMessage || "";
        super(cause, message);
        this.name = this.constructor.name;
        this.errorCode = errorCode || CruxClientError.FALLBACK_ERROR_CODE;
    }
}
