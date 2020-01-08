import 'mocha';
import sinon from "sinon";
import * as cwc from "../../application/clients/crux-wallet-client";
import chaiAsPromised from "chai-as-promised";
import * as chai from "chai";

import {CruxWalletClient} from "../../application/clients/crux-wallet-client";
import {
    addDomainToRepo,
    addUserToRepo,
    getValidCruxDomain,
    getValidCruxUser,
    InMemoryCruxDomainRepository,
    InMemoryCruxUserRepository
} from "./test-utils";

chai.use(chaiAsPromised);
chai.should();

const testCruxDomain = getValidCruxDomain();
const testCruxUser = getValidCruxUser();

describe('Client Tests', function() {
    describe('CruxWalletClient Tests', function() {
        beforeEach(function() {
            this.inmemUserRepo = new InMemoryCruxUserRepository();
            this.inmemDomainRepo = new InMemoryCruxDomainRepository();
            addUserToRepo(testCruxUser, this.inmemUserRepo);
            addDomainToRepo(testCruxDomain, this.inmemDomainRepo);
            sinon.stub(cwc, 'getCruxDomainRepository').callsFake(() => this.inmemDomainRepo as any);
            sinon.stub(cwc, 'getCruxUserRepository').callsFake(() => this.inmemUserRepo as any);
        });
        it('Nonexistent wallet name raises error', async function() {
            let cc = new CruxWalletClient({
                walletClientName: 'nonexistent'
            });
            const promise = cc.resolveCurrencyAddressForCruxID(testCruxUser.cruxID.toString(), 'bitcoin');
            return promise.should.eventually.be.rejected.with.property('errorCode', 1014);
        });
        it('Resolve a valid users address', async function() {
            let cc = new CruxWalletClient({
                walletClientName: 'somewallet'
            });
            const address = await cc.resolveCurrencyAddressForCruxID(testCruxUser.cruxID.toString(), 'bitcoin');
            return address.should.have.property('addressHash').equals('foobtcaddress');
        });

    });
});
