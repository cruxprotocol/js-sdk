import { ERROR_STRINGS } from "./error-string";
import {PackageError} from "./package-error";
import {PackageErrorCode} from "./package-error-code";

export class ErrorHelper {
    public static getPackageError(cause: Error | null, errorCode: PackageErrorCode, ...optionalArgs: any[]): PackageError {
        const message = ErrorHelper.getErrorMessage(errorCode, ...optionalArgs);
        return new PackageError(cause, message, errorCode as number);
    }

    private static getErrorMessage(errorCode: PackageErrorCode, ...optionalArgs: any[]): string {
        return ErrorHelper.formatErrorMessage(ERROR_STRINGS[errorCode], ...optionalArgs);
    }

    private static formatErrorMessage(errorMessage: string, ...optionalArgs: any[]): string {
        if (!errorMessage) {
            return errorMessage;
        }

        let result: string = errorMessage;
        const args: string[] = ErrorHelper.getOptionalArgsArrayFromFunctionCall(arguments, 1);
        if (args) {
            for (let i: number = 0; i < args.length; i++) {
                // tslint:disable-next-line: tsr-detect-non-literal-regexp
                result = result.replace(new RegExp("\\{" + i + "\\}", "g"), args[i]);
            }
        }

        return result;
    }

    private static getOptionalArgsArrayFromFunctionCall(functionArguments: IArguments, startIndex: number): any[] {
        if (functionArguments.length <= startIndex) {
            return [];
        }

        if (Array.isArray(functionArguments[startIndex])) {
            return functionArguments[startIndex];
        }

        return Array.prototype.slice.apply(functionArguments, [startIndex]);
    }
}
