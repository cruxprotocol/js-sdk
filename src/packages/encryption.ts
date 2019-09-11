var ecies = require("eciesjs")

export class Encryption {
    
    static eciesEncryptString(value: string, publicKey: string){   
        let buffer = new Buffer(value, "utf-8")    
        let encryptedData = ecies.encrypt(publicKey, buffer);
        encryptedData = encryptedData.toString('hex');
        return encryptedData;
    }
    
    static eciesDecryptString(value: string, privateKey: string){
        let encryptedString = new Buffer(value, 'hex')
        // let encryptedString = Buffer.from(value, 'hex');
        let buffer = ecies.decrypt(privateKey, encryptedString);
        let converted = buffer.toString('utf-8')
        return converted
    }

    static digest = async (str: string): Promise<string> => {
        let buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str))
        return Array.prototype.map.call(new Uint8Array(buffer), x => (('00'+x.toString(16)).slice(-2))).join('')
    }

    static encryptJSON = async (jsonObj: object, password: string): Promise<{encBuffer: string, iv: string}> => {
        let plainText = JSON.stringify(jsonObj)
        return Encryption.encryptText(plainText, password)
    }
    
    static decryptJSON = async (ctBufferBase64: string, ivBase64: string, password: string): Promise<object> => {
        let JSONString = await Encryption.decryptText(ctBufferBase64, ivBase64, password)
        return JSON.parse(JSONString)
    }

    static encryptText = async (plainText: string, password: string, ivBase64?: string): Promise<{encBuffer: string, iv: string}> => {
        const ptUtf8 = new TextEncoder().encode(plainText);

        const pwUtf8 = new TextEncoder().encode(password);
        const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8); 

        const iv = ivBase64 ? Buffer.from(ivBase64, 'base64') : crypto.getRandomValues(new Uint8Array(12));
        const alg = { name: 'AES-GCM', iv: iv };
        const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['encrypt']);

        return { iv: Buffer.from(iv).toString('base64'), encBuffer: Buffer.from(await crypto.subtle.encrypt(alg, key, ptUtf8)).toString('base64') };
    }

    static decryptText = async (ctBufferBase64: string, ivBase64: string, password: string): Promise<string> => {
        let ctBuffer = Buffer.from(ctBufferBase64, 'base64')
        let iv = Buffer.from(ivBase64, 'base64')

        const pwUtf8 = new TextEncoder().encode(password);
        const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);

        const alg = { name: 'AES-GCM', iv: iv };
        const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['decrypt']);

        const ptBuffer = await crypto.subtle.decrypt(alg, key, ctBuffer);

        const plaintext = new TextDecoder().decode(ptBuffer);

        return plaintext;
    }
}