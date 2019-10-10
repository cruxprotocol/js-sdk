import { expect } from 'chai';
import 'mocha';
import {BlockstackId, CruxId, IdTranslator} from "../packages/identity-utils";
import { errors } from '..';

// TODO: strict validation of the cruxID format

describe('ID Translation Tests', () => {
    let testBlockstackId1 = 'ankit.exodus.id'
    let testCruxId1 = 'ankit@exodus.crux'

    let testBlockstackId3 = 'foo.crux.id'
    let testCruxId3 = 'foo@crux'

    it('blockstack id translates to crux id', () => {
        let bsid = BlockstackId.fromString(testBlockstackId1)
        console.log(bsid.components)
        expect(IdTranslator.blockstackToCrux(bsid).toString()).to.equal(testCruxId1)

        let bsid3 = BlockstackId.fromString(testBlockstackId3)
        expect(IdTranslator.blockstackToCrux(bsid3).toString()).to.equal(testCruxId3)


    })

    it('crux id translates to blockstack id', () => {
        let csid = CruxId.fromString(testCruxId1)
        expect(IdTranslator.cruxToBlockstack(csid).toString()).to.equal(testBlockstackId1)

        let csid3 = CruxId.fromString(testCruxId3)
        expect(IdTranslator.cruxToBlockstack(csid3).toString()).to.equal(testBlockstackId3)

    })
    it('crux id regex validation', () => {
        let raisedError
        try{
            let csid = CruxId.validateSubdomain('coin**switch')
        }
        catch(error) {
            raisedError = error
        }
        expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.SubdomainRegexMatchFailure)
    })
    it('crux id minimun length constrain validation', () => {
        let raisedError
        try{
            let csid = CruxId.validateSubdomain('abc')
        }
        catch(error) {
            raisedError = error
        }
        expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.SubdomainLengthCheckFailure)
    })
    it('crux id maximum length constrain validation', () => {
        let raisedError
        try{
            let csid = CruxId.validateSubdomain('mynameisanthonygonsalves')
        }
        catch(error) {
            raisedError = error
        }
        expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.SubdomainLengthCheckFailure)
    })

    it('crux id without subdomain and invalid namespace', () => {
        let raisedError
        try {
            let csid = CruxId.fromString('exodus.rux')
        }
        catch(error){
            raisedError= error
        }
        expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.CruxIdNamespaceValidation)

    })
    it('crux id maximum components validation', () => {
        let raisedError
        try {
            let csid = CruxId.fromString('ram@coinswitch@exodus.crux')
        }
        catch(error){
            raisedError= error
        }
        expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.CruxIdLengthValidation)

    })
    it('crux id with invalid namespace', () => {
        let raisedError
        try {
            let csid = CruxId.fromString('ram@exodus.rux')
        }
        catch(error){
            raisedError= error
        }
        expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.CruxIdNamespaceValidation)

    })

    it('blockstack id components is 1, throws "BlockstackIdLengthValidation"', () => {
        let raisedError
        try{
            let csid = BlockstackId.fromString('ram')
        }
        catch(error) {
            raisedError = error
        }
        expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.BlockstackIdLengthValidation)
    })
    it('blockstack id invalid namespace, throws "BlockstackIdNamespaceValidation"', () => {
        let raisedError
        try{
            let csid = BlockstackId.fromString('ram.exodus.crux')
        }
        catch(error) {
            raisedError = error
        }
        expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.BlockstackIdNamespaceValidation)
    })
    it('translate crux id to blockstack with invalid namespace, throws "CruxIdNamespaceValidation"', () => {
        let raisedError
        try{
            let csid = BlockstackId.fromString('ram.exodus.id')
            csid.components.namespace = 'CRUX'
            let bsid = IdTranslator.cruxToBlockstack(csid)
        }
        catch(error) {
            raisedError = error
        }
        expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.CruxIdNamespaceValidation)
    })

    it('translate blockstack id without subdomain, throws "BlockstackIdInvalidSubdomain"', () => {
        let raisedError
        try{
            let csid = CruxId.fromString('ram.exodus.crux')
            csid.components.subdomain = ''
            let bsid = IdTranslator.blockstackToCrux(csid)
        }
        catch(error) {
            raisedError = error
        }
        expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.BlockstackIdInvalidSubdomain)
    })
    it('blockstack id with invalid namespace, throws "BlockstackIdNamespaceValidation"', () => {
        let raisedError
        try{
            let csid = CruxId.fromString('ram@exodus.crux')
            csid.components.namespace = 'CRUX'
            let bsid = IdTranslator.blockstackToCrux(csid)
        }
        catch(error) {
            raisedError = error
        }
        expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.BlockstackIdNamespaceValidation)
    })


})