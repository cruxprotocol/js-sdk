import { expect } from 'chai';
import 'mocha';
import { getKeyPairFromPrivKey } from '../packages/utils';
import { PackageErrorCode } from '../packages/error';

describe('Utils tests', () => {
    describe('getKeyPairFromPrivKey tests', () => {
        const correctWIF = "L5PB4Ahtz8NHRLj3bD39cXKXgiZqp8z2z1cWgpv356cUHfzQNdNH"
        const incorrectWIF = "5KfZBgoskJXehrnKiHKcUzAdrnDResHzzmztawouaZ5s8tCPdMo"
        const correctHex = "f39144442f46834cee9cf4ca60765c2fb494dfe9c6d841b777479bda09aab8be"
        const incorrectHex = "0249400EBA6D8AEE6CD943B9FC9A6131049C80F2B83A62A0BBCAC2B7A4CD782EA3"
        const correctBase64 = "85FERC9Gg0zunPTKYHZcL7SU3+nG2EG3d0eb2gmquL4="
        const incorrectBase64 = "BElADrptiu5s2UO5/JphMQScgPK4OmKgu8rCt6TNeC6jy8f3YgAWs4WUknSnW5UjGyKl3O2tk1DMjpbE621c6cg="

        it('correct WIF should return the keyPair object', () => {
            const keyPair = getKeyPairFromPrivKey(correctWIF)
            expect(keyPair.privKey).is.a('string')
            expect(keyPair.pubKey).is.a('string')
            expect(keyPair.address).is.a('string')
        })
        it('incorrect WIF should throw error', () => {
            let raisedError;
            try {
                const keyPair = getKeyPairFromPrivKey(incorrectWIF)
            } catch (error) {
                raisedError = error;
            }
            expect(raisedError).is.not.undefined
            expect(raisedError.errorCode).to.be.equal(PackageErrorCode.InvalidPrivateKeyFormat)
        })
        it('correct hex should return the keyPair object', () => {
            const keyPair = getKeyPairFromPrivKey(correctHex)
            expect(keyPair.privKey).is.a('string')
            expect(keyPair.pubKey).is.a('string')
            expect(keyPair.address).is.a('string')
        })
        it('incorrect hex should throw error', () => {
            let raisedError;
            try {
                const keyPair = getKeyPairFromPrivKey(incorrectHex)
            } catch (error) {
                raisedError = error;
            }
            expect(raisedError).is.not.undefined
            expect(raisedError.errorCode).to.be.equal(PackageErrorCode.InvalidPrivateKeyFormat)
        })
        it('correct base64 should return the keyPair object', () => {
            const keyPair = getKeyPairFromPrivKey(correctBase64)
            expect(keyPair.privKey).is.a('string')
            expect(keyPair.pubKey).is.a('string')
            expect(keyPair.address).is.a('string')
        })
        it('incorrect base64 should throw error', () => {
            let raisedError;
            try {
                const keyPair = getKeyPairFromPrivKey(incorrectBase64)
            } catch (error) {
                raisedError = error;
            }
            expect(raisedError).is.not.undefined
            expect(raisedError.errorCode).to.be.equal(PackageErrorCode.InvalidPrivateKeyFormat)
        }) 
    })
})
