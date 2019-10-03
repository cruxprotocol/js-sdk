import ecies from "eciesjs";
import {ErrorHelper, PackageErrorCode} from "./error";

export class Encryption {

    public static digest = async (str: string): Promise<string> => {
        const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
        return Array.prototype.map.call(new Uint8Array(buffer), (x) => (("00" + x.toString(16)).slice(-2))).join("");
    }

    public static encryptJSON = async (jsonObj: object, password: string): Promise<{encBuffer: string, iv: string}> => {
        const plainText = JSON.stringify(jsonObj);
        return Encryption.encryptText(plainText, password);
    }

    public static decryptJSON = async (ctBufferBase64: string, ivBase64: string, password: string): Promise<object> => {
        const JSONString = await Encryption.decryptText(ctBufferBase64, ivBase64, password);
        return JSON.parse(JSONString);
    }

    public static encryptText = async (plainText: string, password: string): Promise<{ encBuffer: string; iv: string }> => {
        const ptUtf8 = new TextEncoder().encode(plainText);

        const pwUtf8 = new TextEncoder().encode(password);
        const pwHash = await crypto.subtle.digest("SHA-256", pwUtf8);

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const alg = { name: "AES-GCM", iv };
        // @ts-ignore
        const key = await crypto.subtle.importKey("raw", pwHash, alg, false, ["encrypt"]);

        return { iv: Buffer.from(iv).toString("base64"), encBuffer: Buffer.from(await crypto.subtle.encrypt(alg, key, ptUtf8)).toString("base64") };
    }

    public static decryptText = async (ctBufferBase64: string, ivBase64: string, password: string): Promise<string> => {

            const ctBuffer = Buffer.from(ctBufferBase64, "base64");
            const iv = Buffer.from(ivBase64, "base64");

            const pwUtf8 = new TextEncoder().encode(password);
            const pwHash = await crypto.subtle.digest("SHA-256", pwUtf8);

            const alg = {name: "AES-GCM", iv};
            // @ts-ignore
            const key = await crypto.subtle.importKey("raw", pwHash, alg, false, ["decrypt"]);
            let ptBuffer;
            try {
                ptBuffer = await crypto.subtle.decrypt(alg, key, ctBuffer);
            } catch (err) {
                if (err instanceof DOMException) {
                    throw ErrorHelper.getPackageError(PackageErrorCode.DecryptionFailed);
                }
                throw err;
            }
            return new TextDecoder().decode(ptBuffer);
    }
}
