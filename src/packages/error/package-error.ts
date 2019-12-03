import { VError } from "./base-error";
export class PackageError extends VError {
    public errorCode: number;
    constructor(cause: Error | null, message?: string, code?: number) {
        super(cause, message);
        this.name = this.constructor.name;
        this.message = message || "";
        this.errorCode = code || 1000;
    }
}
