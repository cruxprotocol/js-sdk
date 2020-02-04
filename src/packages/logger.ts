import Logger from "js-logger";
import path from "path";
import config from "../config";

// Setup logging configuration
Logger.useDefaults();
Logger.setLevel(config.LOGGING_LEVEL === "DEBUG" ? Logger.DEBUG : Logger.INFO);
export function getLogger(filename: string) {
    return Logger.get("CruxPay: " + filename.slice(filename.lastIndexOf(path.sep) + 1, filename.length - 3));
}
