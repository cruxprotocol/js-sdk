import { expect } from 'chai';
import 'mocha';
import {BlockstackId, CruxId, IdTranslator} from "../packages/identity-utils";

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


})