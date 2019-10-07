import { expect } from 'chai';
import 'mocha';
import {PackageErrorCode} from "../packages/error/package-error-code";

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