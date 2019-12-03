export class VError extends Error {
    constructor(cause: Error | null, message?: string) {
        super(message);
        if (this.stack && cause && cause.stack) {
            this.stack = this.stack.concat("\n\n").concat(cause.stack);
        }
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
