import { BaseError, PackageError } from "../../packages/error";
export class CruxOnBoardingClientError extends BaseError {
    public static FALLBACK_ERROR_CODE: number = 8000;
    public static fromError(error: CruxOnBoardingClientError | PackageError | Error | string, messagePrefix?: string): CruxOnBoardingClientError {
        const msgPrefix: string = messagePrefix === undefined ? "" : messagePrefix + " : ";
        if (error instanceof CruxOnBoardingClientError) {
            if (error.message !== undefined) {
                error.message = msgPrefix + error.message;
            }
            return error;
        }  else if (error instanceof PackageError) {
            return new CruxOnBoardingClientError(error, msgPrefix + error.message, error.errorCode);
        } else if (typeof (error) === "string") {
            return new CruxOnBoardingClientError(null, msgPrefix + error);
        } else if (error instanceof Error) {
            return new CruxOnBoardingClientError(error, msgPrefix + error.message);
        } else {
            throw new BaseError(null, `Wrong instance type: ${typeof (error)}`);
        }
    }
    public errorCode: number;
    constructor(cause: Error | null, errorMessage: string, errorCode?: number) {
        const message = errorMessage || "";
        super(cause, message, errorCode);
        this.name = this.constructor.name;
        this.errorCode = errorCode || CruxOnBoardingClientError.FALLBACK_ERROR_CODE;
    }
}
// Decorator to convert errors into CruxOnBoardingClientError
export const throwCruxOnBoardingClientError = (target: any, prop: any, descriptor?: { value?: any; }): any => {
    let fn: any;
    let patchedFn: any;
    if (descriptor) {
        fn = descriptor.value;
    }
    return {
        configurable: true,
        enumerable: true,
        get() {
            if (!patchedFn) {
                patchedFn = async (...params: any[]) => {
                    try {
                        return await fn.call(this, ...params);
                    } catch (error) {
                        throw CruxOnBoardingClientError.fromError(error);
                    }
                };
            }
            return patchedFn;
        },
        set(newFn: any) {
            patchedFn = undefined;
            fn = newFn;
        },
    };
};
