export class Encryption {
    
    static digest = async (str: string): Promise<string> => {
        let buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str))
        return Array.prototype.map.call(new Uint8Array(buffer), x=>(('00'+x.toString(16)).slice(-2))).join('')
    }

    static encryptJSON = async (jsonObj: JSON, password: string): Promise<{encBuffer: ArrayBuffer, iv: Uint8Array}> => {
        let plainText = JSON.stringify(jsonObj)
        return Encryption.encryptText(plainText, password)
    }
    
    static decryptJSON = async (ctBuffer: ArrayBuffer, iv: Uint8Array, password: string): Promise<JSON> => {
        let JSONString = await Encryption.decryptText(ctBuffer, iv, password)
        return JSON.parse(JSONString)
    }

    static encryptText = async (plainText: string, password: string, ivBase64?: string): Promise<{encBuffer: ArrayBuffer, iv: Uint8Array}> => {
        const ptUtf8 = new TextEncoder().encode(plainText);

        const pwUtf8 = new TextEncoder().encode(password);
        const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8); 

        const iv = ivBase64 ? Buffer.from(ivBase64, 'base64') : crypto.getRandomValues(new Uint8Array(12));
        const alg = { name: 'AES-GCM', iv: iv };
        const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['encrypt']);

        return { iv, encBuffer: await crypto.subtle.encrypt(alg, key, ptUtf8) };
    }

    static decryptText = async (ctBuffer: ArrayBuffer, iv: Uint8Array, password: string): Promise<string> => {
        const pwUtf8 = new TextEncoder().encode(password);
        const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);

        const alg = { name: 'AES-GCM', iv: iv };
        const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['decrypt']);

        const ptBuffer = await crypto.subtle.decrypt(alg, key, ctBuffer);

        const plaintext = new TextDecoder().decode(ptBuffer);

        return plaintext;
    }
}