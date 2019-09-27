import { ERROR_STRINGS } from "./error-string";
import {PackageError} from "./package-error";
import {PackageErrorCode} from "./package-error-code";

export class ErrorHelper {
    public static ERROR_STRINGS = ERROR_STRINGS;
    public static getPackageError(errorCode: PackageErrorCode, ...optionalArgs: any[]): PackageError {
        const message = ErrorHelper.getErrorMessage(errorCode, ...optionalArgs);
        return new PackageError(message, errorCode as number);
    }

    private static getErrorMessage(errorCode: PackageErrorCode, ...optionalArgs: any[]): string {
        return ErrorHelper.formatErrorMessage(ErrorHelper.ERROR_STRINGS[errorCode], ...optionalArgs);
    }

    private static formatErrorMessage(errorMessage: string, ...optionalArgs: any[]): string {
        if (!errorMessage) {
            return errorMessage;
        }

        let result: string = errorMessage as string;
        const args: string[] = ErrorHelper.getOptionalArgsArrayFromFunctionCall(arguments, 1);
        if (args) {
            for (let i: number = 0; i < args.length; i++) {
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
