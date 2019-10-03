export class PackageError extends Error {
    public errorCode: number;
    constructor(message?: string, code?: number) {
        super(message);
        this.message = message || "";
        this.errorCode = code || 1000;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
