import { expect } from 'chai';
import 'mocha';
import {PackageErrorCode} from "../packages/error/package-error-code";
import { CruxClientError } from '../packages/error';

export function reader(){
    let error = 0
    let error_code = 0
    for(let item in PackageErrorCode) {
        if(isNaN(Number(item))) error++
        else error_code++
        }
    return [error,error_code]
}

describe('Error Codes Tests',() => {
    it ('No duplicate error codes', () => {
        let codes = reader()
        expect(codes[0]).to.equal(codes[1])
    })
})

describe('CruxClientError tests', () => {
    it('CruxClientError with undefined message returns "CruxClientError with errorCode 9000"', () => {
        let message
        let cruxErrorClient1 = new CruxClientError(null, message)
        let raisederror1 = CruxClientError.fromError(cruxErrorClient1)
        expect(raisederror1.errorCode).to.be.equal(9000)
        expect(raisederror1).to.be.an.instanceOf(CruxClientError)
    })
    it('error of string type returns  CruxClientError', ()=> {
        let raisederror = CruxClientError.fromError("someError")
        expect(raisederror).to.be.an.instanceOf(CruxClientError)
    })
    it('error of Error type returns  CruxClientError', ()=> {
        let errorclient = new Error()
        let raisederror = CruxClientError.fromError(errorclient)
        expect(raisederror).to.be.an.instanceOf(CruxClientError)
    })
    
})