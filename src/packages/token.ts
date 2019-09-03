import { getLogger } from "..";
import crypto from "crypto";

let log = getLogger(__filename)

export interface ITokenPayload {
    accessToken: string
    ephemeralPublicKey: string
    iv: string
    encryptedValidity?: string
}

export class TokenController {
    static _encryptStringSymmetric = (value: string, key: string, ivHex?: string): { encryptedString: string, iv: string} => {
        let keyHash = crypto.createHash('sha256').update(key).digest()
        let iv = ivHex ? Buffer.from(ivHex, 'hex') : crypto.randomBytes(16);
        let cipher = crypto.createCipheriv('aes-256-ctr', keyHash, iv)
        let crypted = cipher.update(value, 'utf8', 'hex')
        crypted += cipher.final('hex');
        return {
            encryptedString: crypted,
            iv: iv.toString('hex')
        };
    }

    static _decryptStringSymmetric = (value: string, key: string) => {  
        let textParts = value.split(':');
        let iv = Buffer.from(textParts.shift(), 'hex');
        let encryptedText = Buffer.from(textParts.join(':'), 'hex')
        let keyHash = crypto.createHash('sha256').update(key).digest()
        let decipher = crypto.createDecipheriv('aes-256-ctr', keyHash, iv)
        let decrypted = decipher.update(encryptedText, undefined, 'utf8')
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    
    static _deriveSharedSecret = ( publicKeyB: string, privateKeyA?: string ): { sharedSecret: string, ephemeralPublicKey: string } => {
        // Setup A
        let a = crypto.createECDH('secp256k1');
        a.generateKeys();
    
        if (privateKeyA) { 
            a.setPrivateKey(privateKeyA, 'hex') 
        }
        
        // TODO: TEMPORARY FIXED KEY SETUP
        else {
            a.setPrivateKey('520c4cdbdfd2a6df238074c53a523e8c2351c185e6a1c481e8245ccca6da4f4a', 'hex')
        }
    
        let publicKey = a.getPublicKey(null, 'compressed')
        let privateKey = a.getPrivateKey()
    
        log.debug('PrivateA:', privateKey.length, privateKey.toString('hex'));
        log.debug('PublicA: ', publicKey.length, publicKey.toString('hex'));
    
        let publicKey2 = Buffer.from(publicKeyB, 'hex')
        log.debug('PublicB: ', publicKey2.length, publicKey2.toString('hex'));
    
        let aSecret = a.computeSecret(publicKey2, 'hex');
        log.debug('SecretA: ', aSecret.length, aSecret.toString('hex'));
    
        return {
            sharedSecret: aSecret.toString('hex'),
            ephemeralPublicKey: publicKey.toString('hex')
        }
    }

    static checkValidity = (privateKey: string, ephemeralPublicKey: string, encryptedValidity: string): boolean => {
        let ssData = TokenController._deriveSharedSecret(ephemeralPublicKey, privateKey)
        let ss = ssData.sharedSecret
        log.debug('ss: ', ss)

        let decryptedValidity = parseInt(TokenController._decryptStringSymmetric(encryptedValidity, ss))
        log.debug('decryptedValidity: ', decryptedValidity)
        return ( new Date().getTime() < decryptedValidity ) ? true : false
    }

    static generateAccessToken(passcode: string, publicKey?: string, privateKey?: string, ephemeralPublicKey?: string, iv?: string): { accessToken: string, ephemeralPublicKey?: string, iv?: string, encryptedValidity?: string } {
        if ( passcode && publicKey ) {
            // Derive the shared secret
            let ssData = TokenController._deriveSharedSecret(publicKey)
            let ss = ssData.sharedSecret
            log.debug('ss: ', ss)
            
            // Encrypt the validity timestamp with the shared secret
            let validTill = new Date().getTime() + (60 * 60 * 1000) // temporarily adding an hour 
            log.debug('validTill: ', validTill)
            let encryptedValidityData = TokenController._encryptStringSymmetric(validTill.toString(), ss)
            let encryptedValidity = `${encryptedValidityData.iv}:${encryptedValidityData.encryptedString}`
            log.debug('encryptedValidity: ', encryptedValidity)

            // (AccessToken) Encrypt the shared secret with a random IV
            let essData = TokenController._encryptStringSymmetric(ss, passcode)
            let ess = essData.encryptedString
            log.debug('ess: ', ess)
            return {
                accessToken: ess,
                ephemeralPublicKey: ssData.ephemeralPublicKey,
                iv: essData.iv,
                encryptedValidity: encryptedValidity
            }
        }
        else if ( passcode && privateKey && ephemeralPublicKey && iv ) {
            // Derive the shared secret
            let ssData = TokenController._deriveSharedSecret(ephemeralPublicKey, privateKey)
            let ss = ssData.sharedSecret
            log.debug('ss: ', ss)

            // (AccessToken) Encrypt the shared secret using the same IV
            let essData = TokenController._encryptStringSymmetric(ss, passcode, iv)
            let ess = essData.encryptedString
            return {
                accessToken: ess
            }
        }
        else throw (`Throw either combination of (passcode & publicKey) || (passcode & privateKey & ephemeralPublicKey & ivHex) are required`)
    
    }
}