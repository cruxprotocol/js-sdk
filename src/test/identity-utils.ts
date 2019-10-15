import { expect } from 'chai';
import 'mocha';
import {BlockstackId, CruxId, IdTranslator, validateSubdomain} from "../packages/identity-utils";
import { errors } from '..';

// TODO: strict validation of the cruxID format

describe('ID Translation Tests', () => {
    let testBlockstackId1 = 'ankit.exodus_crux.id'
    let testCruxId1 = 'ankit@exodus.crux'


    let testBlockstackId2 = 'ankit.something.id'

    let testBlockstackId3 = 'ankit.something_crux.foo'


    it('blockstack id translates to crux id', () => {
        let bsid = BlockstackId.fromString(testBlockstackId1)
        expect(IdTranslator.blockstackToCrux(bsid).toString()).to.equal(testCruxId1)
    })

    it('crux id translates to blockstack id', () => {
        let csid = CruxId.fromString(testCruxId1)
        expect(IdTranslator.cruxToBlockstack(csid).toString()).to.equal(testBlockstackId1)
    })

    it('blockstack id which cant be translated because of domain', () => {
        let raisedError;
        try {
            let bsid = BlockstackId.fromString(testBlockstackId2)
            IdTranslator.blockstackToCrux(bsid) //  INVALID DOMAIN TO TRANSLATE
        } catch (e) {
            raisedError = e;
        }
        expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.BlockstackIdInvalidDomainForTranslation)
    })

    it('blockstack id which cant be translated because of namespace', () => {
        let raisedError;
        try {
            let bsid = BlockstackId.fromString(testBlockstackId3) // SHOULD RAISE ERROR
            IdTranslator.blockstackToCrux(bsid) // INVALID NAMESPACE TO TRANSLATE
        } catch (e) {
            raisedError = e;
        }
        expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.BlockstackIdNamespaceValidation)
    })

    it('invalid crux id because of structure', () => {
        let raisedError;
        try {
            CruxId.fromString('abcd@foobar') // SHOULD RAISE ERROR
        } catch (e) {
            raisedError = e;
        }
        expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.CruxIdInvalidStructure)
    })

    it('invalid subdomain due to regex', () => {
        let raisedError;
        try {
            validateSubdomain('_foofoo')
        } catch (e) {
            raisedError = e;
        }
        expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.SubdomainRegexMatchFailure)
    })

    it('invalid subdomain due to length', () => {
        let raisedError;
        try {
            validateSubdomain('foo')
        } catch (e) {
            raisedError = e;
        }
        expect(raisedError.errorCode).to.be.equal(errors.PackageErrorCode.SubdomainLengthCheckFailure)
    })



})
