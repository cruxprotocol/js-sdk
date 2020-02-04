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
    let testBlockstackId = 'exodus_crux.id'

    let testBlockstackId4 = 'foobar.id'
    let testInvalidNamespaceId = 'alice.foo'
    let testCruxInvalidNamespaceId = 'alice@foo.bar'

    it('blockstack id initialization without subdomain', () => {
        let bsid = BlockstackId.fromString(testBlockstackId4);
        expect(bsid).to.be.instanceOf(BlockstackId);
        expect(bsid.toString()).to.be.eql(testBlockstackId4);
    })

    it('BlockstackId.fromString should fail with BlockstackIdInvalidStructure', () => {
        expect(() => BlockstackId.fromString("alice")).to.throw(PackageError).with.property('errorCode', PackageErrorCode.BlockstackIdInvalidStructure);
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
        expect(() => CruxDomainId.fromString("alice")).to.throw(PackageError).with.property('errorCode', PackageErrorCode.CruxDomainInvalidStructure);
    })

    it('CruxDomainId.fromString should fail with CruxDomainNamespaceValidation', () => {
        expect(() => CruxDomainId.fromString(testInvalidNamespaceId)).to.throw(PackageError).with.property('errorCode', PackageErrorCode.CruxDomainNamespaceValidation);
    })

    it('CruxId.fromString should fail with CruxIdNamespaceValidation', () => {
        expect(() => CruxId.fromString(testCruxInvalidNamespaceId)).to.throw(PackageError).with.property('errorCode', PackageErrorCode.CruxIdNamespaceValidation);
    })

    it('BlockstackDomainId.fromString should fail with BlockstackDomainInvalidStructure', () => {
        expect(() => BlockstackDomainId.fromString("alice")).to.throw(PackageError).with.property('errorCode', PackageErrorCode.BlockstackDomainInvalidStructure);
    })

    it('BlockstackDomainId.fromString should fail with CruxDomainNamespaceValidation', () => {
        expect(() => BlockstackDomainId.fromString(testInvalidNamespaceId)).to.throw(PackageError).with.property('errorCode', PackageErrorCode.BlockstackDomainNamespaceValidation);
    })

    it('crux id translates to blockstack id', () => {
        let csid = CruxId.fromString(testCruxId1)
        expect(IdTranslator.cruxToBlockstack(csid).toString()).to.equal(testBlockstackId1)
    })

    it('blockstack id which cant be translated because of domain', () => {
        let bsid = BlockstackId.fromString(testBlockstackId2)
        expect(() => IdTranslator.blockstackToCrux(bsid)).to.throw(PackageError).with.property('errorCode', PackageErrorCode.InvalidBlockstackDomainForTranslation);
    })

    it('blockstack id which cant be translated because of namespace', () => {
        expect(() => BlockstackId.fromString(testBlockstackId3)).to.throw(PackageError).with.property('errorCode', PackageErrorCode.BlockstackIdNamespaceValidation);
    })

    it('blockstackToCrux should throw BlockstackIdInvalidSubdomainForTranslation', () => {
        let bsid = BlockstackId.fromString(testBlockstackId) // SHOULD RAISE ERROR
        expect(() => IdTranslator.blockstackToCrux(bsid)).to.throw(PackageError).with.property('errorCode', PackageErrorCode.BlockstackIdInvalidSubdomainForTranslation)
    })

    it('blockstackDomainStringToCruxDomainString should throw InvalidBlockstackDomainForTranslation', () => {
        const testBlockstackDomainString = "foobar.id";
        expect(() => IdTranslator.blockstackDomainStringToCruxDomainString(testBlockstackDomainString)).to.throw(PackageError).with.property('errorCode', PackageErrorCode.InvalidBlockstackDomainForTranslation);
    })

    it('invalid crux id because of structure', () => {
        expect(() => CruxId.fromString('abcd@foobar')).to.throw(PackageError).with.property('errorCode', PackageErrorCode.CruxIdInvalidStructure)
    })

    it('invalid subdomain due to regex', () => {
        expect(() => validateSubdomain('_foofoo')).to.throw(PackageError).with.property('errorCode', PackageErrorCode.SubdomainRegexMatchFailure);
    })

    it('invalid subdomain due to min length', () => {
        expect(() => validateSubdomain('foo')).to.throw(PackageError).with.property('errorCode', PackageErrorCode.SubdomainLengthCheckFailure);
    })

    it('invalid subdomain due to max length', () => {
        expect(() => validateSubdomain('foobarfoobarfoobarfoobarfoobarfoobarfoobar')).to.throw(PackageError).with.property('errorCode', PackageErrorCode.SubdomainLengthCheckFailure);
    })

    it('valid subdomain case', () => {
        expect(() => validateSubdomain('foobar')).to.not.throw();
    })

})
