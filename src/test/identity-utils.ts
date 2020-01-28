import { expect } from 'chai';
import 'mocha';
import {BlockstackId, CruxId, IdTranslator, validateSubdomain, BlockstackDomainId, CruxDomainId} from "../packages/identity-utils";
import { PackageErrorCode, PackageError } from '../packages/error';

// TODO: strict validation of the cruxID format

describe('ID Translation Tests', () => {
    let testBlockstackId1 = 'ankit.exodus_crux.id'
    let testCruxId1 = 'ankit@exodus.crux'


    let testBlockstackId2 = 'ankit.something.id'

    let testBlockstackId3 = 'ankit.something_crux.foo'

    let testBlockstackDomain = 'exodus_crux'
    let testCruxDomainId = 'exodus.crux'

    let testBlockstackId4 = 'foobar.id'
    let testInvalidNamespaceId = 'alice.foo'

    it('blockstack id initialization without subdomain', () => {
        let bsid = BlockstackId.fromString(testBlockstackId4)
        expect(bsid).to.be.instanceOf(BlockstackId);
    })

    it('BlockstackId.fromString should fail with BlockstackIdInvalidStructure', () => {
        let raisedError: Error;
        try {
            BlockstackId.fromString("alice")
        } catch (error) {
            raisedError = error;
        }
        expect(raisedError).to.be.instanceOf(PackageError);
        expect(raisedError["errorCode"]).to.be.equal(PackageErrorCode.BlockstackIdInvalidStructure);
    })

    it('blockstack id translates to crux id', () => {
        let bsid = BlockstackId.fromString(testBlockstackId1)
        expect(IdTranslator.blockstackToCrux(bsid).toString()).to.equal(testCruxId1)
    })

    it('blockstack domain id translates to crux domain id', () => {
        const bsDomainId = new BlockstackDomainId(testBlockstackDomain);
        const cruxDomainId = IdTranslator.blockstackToCrux(bsDomainId);
        expect(cruxDomainId).to.be.instanceOf(CruxDomainId);
        expect(IdTranslator.blockstackToCrux(bsDomainId).toString()).to.equal(testCruxDomainId);
    })

    it('CruxDomainId.fromString should fail with CruxDomainInvalidStructure', () => {
        let raisedError: Error;
        try {
            CruxDomainId.fromString("alice")
        } catch (error) {
            raisedError = error;
        }
        expect(raisedError).to.be.instanceOf(PackageError);
        expect(raisedError["errorCode"]).to.be.equal(PackageErrorCode.CruxDomainInvalidStructure);
    })

    it('CruxDomainId.fromString should fail with CruxDomainNamespaceValidation', () => {
        let raisedError: Error;
        try {
            CruxDomainId.fromString(testInvalidNamespaceId)
        } catch (error) {
            raisedError = error;
        }
        expect(raisedError).to.be.instanceOf(PackageError);
        expect(raisedError["errorCode"]).to.be.equal(PackageErrorCode.CruxDomainNamespaceValidation);
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
        expect(raisedError.errorCode).to.be.equal(PackageErrorCode.InvalidBlockstackDomainForTranslation)
    })

    it('blockstack id which cant be translated because of namespace', () => {
        let raisedError;
        try {
            let bsid = BlockstackId.fromString(testBlockstackId3) // SHOULD RAISE ERROR
            IdTranslator.blockstackToCrux(bsid) // INVALID NAMESPACE TO TRANSLATE
        } catch (e) {
            raisedError = e;
        }
        expect(raisedError.errorCode).to.be.equal(PackageErrorCode.BlockstackIdNamespaceValidation)
    })

    it('invalid crux id because of structure', () => {
        let raisedError;
        try {
            CruxId.fromString('abcd@foobar') // SHOULD RAISE ERROR
        } catch (e) {
            raisedError = e;
        }
        expect(raisedError.errorCode).to.be.equal(PackageErrorCode.CruxIdInvalidStructure)
    })

    it('invalid subdomain due to regex', () => {
        let raisedError;
        try {
            validateSubdomain('_foofoo')
        } catch (e) {
            raisedError = e;
        }
        expect(raisedError.errorCode).to.be.equal(PackageErrorCode.SubdomainRegexMatchFailure)
    })

    it('invalid subdomain due to length', () => {
        let raisedError;
        try {
            validateSubdomain('foo')
        } catch (e) {
            raisedError = e;
        }
        expect(raisedError.errorCode).to.be.equal(PackageErrorCode.SubdomainLengthCheckFailure)
    })



})
