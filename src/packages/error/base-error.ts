export class BaseError extends Error {
    constructor(cause: Error | null, message?: string, code?: number, skipStackStructuring: boolean = false) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = this.constructor.name;

        if (!skipStackStructuring) {
            // Appending code as stack prefix if available
            if (code && this.stack) {
                this.stack = `(${code}) `.concat(this.stack);
            }
            // Preserving the stack of the cause for ease of debugging
            if (this.stack && cause && cause.stack) {
                this.stack = this.stack.concat("\n\n").concat(cause.stack);
            }
        }
    }
}
