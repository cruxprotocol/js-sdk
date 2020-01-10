import 'mocha';
import sinon from "sinon";
import * as cwc from "../../../application/clients/crux-wallet-client";
import chaiAsPromised from "chai-as-promised";
import * as chai from "chai";

import {CruxWalletClient} from "../../../application/clients/crux-wallet-client";
import {SubdomainRegistrationStatus} from "../../../core/entities/crux-user";
import {PackageErrorCode} from "../../../packages/error";
import {
    addDomainToRepo,
    addUserToRepo,
    getValidCruxDomain,
    getValidCruxUser, getValidCruxUser2,
    InMemoryCruxDomainRepository,
    InMemoryCruxUserRepository
} from "../test-utils";

chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;

const testCruxDomain = getValidCruxDomain();
const testCruxUser = getValidCruxUser();
const testCruxUser2 = getValidCruxUser2()
const testPvtKey = '6bd397dc89272e71165a0e7d197b280c7a88ed5b1e44e1928c25455506f1968f';

describe('CruxWalletClient Tests', function() {
    beforeEach(function() {
        this.inmemUserRepo = new InMemoryCruxUserRepository();
        this.inmemDomainRepo = new InMemoryCruxDomainRepository();
        addUserToRepo(testCruxUser, this.inmemUserRepo);
        addUserToRepo(testCruxUser2, this.inmemUserRepo);
        addDomainToRepo(testCruxDomain, this.inmemDomainRepo);
        this.stubGetCruxDomainRepository = sinon.stub(cwc, 'getCruxDomainRepository').callsFake(() => this.inmemDomainRepo as any);
        this.stubGetCruxUserRepository = sinon.stub(cwc, 'getCruxUserRepository').callsFake(() => this.inmemUserRepo as any);
    });
    afterEach(function() {
        this.stubGetCruxUserRepository.restore();
        this.stubGetCruxDomainRepository.restore();
    });
    it('Nonexistent wallet name raises error', async function() {
        let cc = new CruxWalletClient({
            walletClientName: 'nonexistent'
        });
        const promise = cc.resolveCurrencyAddressForCruxID(testCruxUser.cruxID.toString(), 'bitcoin');
        expect(promise).to.eventually.be.rejected.with.property('errorCode', PackageErrorCode.InvalidWalletClientName);
    });
    describe('Resolving a Users ID', function() {
        beforeEach(function() {
            this.cc = new CruxWalletClient({
                walletClientName: 'somewallet'
            });
        });
        it('Happy case - valid users address', async function() {
            const address = await this.cc.resolveCurrencyAddressForCruxID(testCruxUser.cruxID.toString(), 'bitcoin');
            return expect(address).to.have.property('addressHash').equals('foobtcaddress');
        });

        it('Invalid ID', async function() {
            const promise = this.cc.resolveCurrencyAddressForCruxID('lolwamax', 'bitcoin');
            return expect(promise).to.eventually.be.rejected.with.property('errorCode', PackageErrorCode.CruxIdInvalidStructure);
        });
        it('Wallet doesnt have asset id mapped', async function() {
            const promise = this.cc.resolveCurrencyAddressForCruxID(testCruxUser.cruxID.toString(), 'foo');
            return expect(promise).to.eventually.be.rejected.with.property('errorCode', PackageErrorCode.AssetIDNotAvailable);
        });
        it('User doesnt have a currency address', async function() {
            const promise = this.cc.resolveCurrencyAddressForCruxID(testCruxUser.cruxID.toString(), 'ethereum');
            return expect(promise).to.eventually.be.rejected.with.property('errorCode', PackageErrorCode.AddressNotAvailable);
        });
        it('ID is case insensitive', async function() {
            const address = await this.cc.resolveCurrencyAddressForCruxID('Foo123@testwallet.crux', 'bitcoin');
            // Will get fixed after prakhars change
            return expect(address).to.have.property('addressHash').equals('foobtcaddress');
        });

    });

    it('New ID Registration works properly', async function() {
        let cc = new CruxWalletClient({
            walletClientName: 'somewallet',
            privateKey: testPvtKey
        });
        const initIdState = await cc.getCruxIDState();
        expect(initIdState.cruxID).to.equals(null);

        await cc.registerCruxID('newtestuser');
        const idState = await cc.getCruxIDState();
        expect(idState.cruxID).equals('newtestuser@somewallet.crux');
        expect(idState.status.status).equals(SubdomainRegistrationStatus.PENDING);
    });
    describe('ID Availability check', function() {
        beforeEach(function() {
            this.cc = new CruxWalletClient({
                walletClientName: 'somewallet',
                privateKey: testPvtKey
            });
        });
        it('Available ID check', async function() {
            expect(await this.cc.isCruxIDAvailable('random123')).equals(true)
        });
        it('Unavailable ID check', async function() {
            expect(await this.cc.isCruxIDAvailable(testCruxUser2.cruxID.components.subdomain)).equals(false)
        });


    })

    it('User is recovered properly from private key', async function() {
        throw Error("unimplemented");
    });
    it('New address addition works properly', async function() {
        throw Error("unimplemented");
    });
    it('Partial publishing of addresses works', async function() {
        throw Error("unimplemented");
    });

});

