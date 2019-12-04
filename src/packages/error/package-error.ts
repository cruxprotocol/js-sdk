import { BaseError } from "./base-error";
import { PackageErrorCode } from "./package-error-code";
export class PackageError extends BaseError {
    public errorCode: number;
    constructor(cause: Error | null, message?: string, code?: number) {
        super(cause, message, code, true);
        this.name = this.constructor.name;
        this.message = message || "";
        this.errorCode = code || 1000;

        // Changing the Error name printed in the stacktrace if code is given;
        if (code) {
            this.name = PackageErrorCode[code];
            if (this.stack) {
                // Appending code as stack prefix if available
                this.stack = `(${code}) `.concat(this.stack);
            }
        }
        // Stack trace structuring;
        if (this.stack && cause && cause.stack) {
            this.stack = this.stack.concat("\n\n").concat(cause.stack);
        }
    }
}
