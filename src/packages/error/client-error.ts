import { BaseError, PackageError } from ".";

export class ClientError extends BaseError {
    public static FALLBACK_ERROR_CODE: number = 9000;
    public static fromError(error: ClientError | PackageError | Error | string, messagePrefix?: string): ClientError {
        const msgPrefix: string = messagePrefix === undefined ? "" : messagePrefix + " : ";
        if (error instanceof ClientError) {
            if (error.message !== undefined) {
                error.message = msgPrefix + error.message;
            }
            return error;
        }  else if (error instanceof PackageError) {
            return new this(error, msgPrefix + error.message, error.errorCode);
        } else if (typeof (error) === "string") {
            return new this(null, msgPrefix + error);
        } else if (error instanceof Error) {
            return new this(error, msgPrefix + error.message);
        } else {
            throw new BaseError(null, `Wrong instance type: ${typeof (error)}`);
        }
    }
    public errorCode: number;
    constructor(cause: Error | null, errorMessage: string, errorCode?: number) {
        const message = errorMessage || "";
        super(cause, message, errorCode);
        this.name = this.constructor.name;
        this.errorCode = errorCode || ClientError.FALLBACK_ERROR_CODE;
    }
}
