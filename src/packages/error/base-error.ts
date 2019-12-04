export class CruxBaseError extends Error {
    constructor(cause: Error | null, message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = this.constructor.name;
        if (this.stack && cause && cause.stack) {
            this.stack = this.stack.concat("\n\n").concat(cause.stack);
        }
    }
}
