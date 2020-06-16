import 'mocha';
import sinon from "sinon";
import {getPubsubClientFactory} from "../application/clients/crux-wallet-client";
import * as cwc from "../application/clients/crux-wallet-client";
import chaiAsPromised from "chai-as-promised";
import * as chai from "chai";

import {CruxWalletClient, ICruxIDState} from "../application/clients/crux-wallet-client";
import {SubdomainRegistrationStatus} from "../core/entities/crux-user";
import {PackageErrorCode, ERROR_STRINGS} from "../packages/error";
import {InMemoryPubSubClientFactory} from "./crux-messenger/inmemory-implementations";
import {
    addDomainToRepo,
    addUserToRepo,
    getSomewalletDomain,
    getFoo123SomewalletUser, getBar123SomewalletUser,
    InMemoryCruxDomainRepository,
    InMemoryCruxUserRepository,
    getValidPendingCruxUser, patchMissingDependencies,
    testPrivateKeys, MockUserStore,
} from "./test-utils";

patchMissingDependencies()

chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;

const testPvtKey = '6bd397dc89272e71165a0e7d197b280c7a88ed5b1e44e1928c25455506f1968f';  // 1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ
const testPvtKey2 = '12381ab829318742938647283cd462738462873642ef34abefcd123501827193'; // 1JoZwbjMnTmcpAyjjtRBfuqXAb2xiqZRjx
const testPvtKey3 = 'KyEurUTRpQkWnQFQs3dfeFQ1P7yjPNEa3cbM3VWfecnqUzoDUFm4'; // 1DJXVNHXxV3HaVFfbttZURFK1ciBUezypR
const testPvtKey4 = 'L3LdUa4iUDMcbdoTbeRXCRXLnV6kCCFwGNz2zXKVoGcRvZmcjRZm'; // 1NrMvx43pVTbLLyBK4atmFFvHjvBZBsKzJ

describe('CruxWalletClient Tests', function() {
    beforeEach(async function() {
        const mockUserStore = new MockUserStore()
        const testCruxDomain = getSomewalletDomain();
        this.testCruxUser = getFoo123SomewalletUser();
        this.testCruxUser2 = getBar123SomewalletUser();
        this.testPendingCruxUser = getValidPendingCruxUser();
        this.inmemUserRepo = new InMemoryCruxUserRepository(mockUserStore, getSomewalletDomain());
        this.inmemDomainRepo = new InMemoryCruxDomainRepository();
        this.inmemUserRepo = await addUserToRepo(this.testCruxUser, this.inmemUserRepo);
        this.inmemUserRepo = await addUserToRepo(this.testCruxUser2, this.inmemUserRepo);
        this.inmemUserRepo = await addUserToRepo(this.testPendingCruxUser, this.inmemUserRepo);
        this.inmemDomainRepo = await addDomainToRepo(testCruxDomain, this.inmemDomainRepo);
        this.stubGetCruxDomainRepository = sinon.stub(cwc, 'getCruxDomainRepository').callsFake(() => this.inmemDomainRepo as any);
        this.stubGetCruxUserRepository = sinon.stub(cwc, 'getCruxUserRepository').callsFake(() => this.inmemUserRepo as any);
        this.stubGetPubsubClientFactory = sinon.stub(cwc, 'getPubsubClientFactory').callsFake(() => new InMemoryPubSubClientFactory());
    });
    afterEach(function() {
        this.stubGetCruxUserRepository.restore();
        this.stubGetCruxDomainRepository.restore();
        this.stubGetPubsubClientFactory.restore();
    });
    it('Nonexistent wallet name raises error', async function() {
        let cc = new CruxWalletClient({
            walletClientName: 'nonexistent'
        });
        const promise = cc.resolveCurrencyAddressForCruxID(this.testCruxUser.cruxID.toString(), 'bitcoin');
        return expect(promise).to.be.eventually.rejected.with.property('errorCode', PackageErrorCode.InvalidWalletClientName);
    });
    describe('Resolving a Users ID', function() {
        beforeEach(function() {
            this.cc = new CruxWalletClient({
                walletClientName: 'somewallet'
            });
        });
        it('Happy case - valid users address', async function() {
            const address = await this.cc.resolveCurrencyAddressForCruxID(this.testCruxUser.cruxID.toString(), 'bitcoin');
            await expect(address).to.have.property('addressHash').equals('foobtcaddress');
        });

        it('Invalid ID', async function() {
            const promise = this.cc.resolveCurrencyAddressForCruxID('lolwamax', 'bitcoin');
            await expect(promise).to.be.eventually.rejected.with.property('errorCode', PackageErrorCode.CruxIdInvalidStructure);
        });
        it('Wallet doesnt have asset id mapped', async function() {
            const promise = this.cc.resolveCurrencyAddressForCruxID(this.testCruxUser.cruxID.toString(), 'foo');
            await expect(promise).to.be.eventually.rejected.with.property('errorCode', PackageErrorCode.AssetIDNotAvailable);
        });
        it('User doesnt have a currency address', async function() {
            const promise = this.cc.resolveCurrencyAddressForCruxID(this.testCruxUser.cruxID.toString(), 'ethereum');
            await expect(promise).to.be.eventually.rejected.with.property('errorCode', PackageErrorCode.AddressNotAvailable);
        });
        it('ID is case insensitive', async function() {
            const address = await this.cc.resolveCurrencyAddressForCruxID('Foo123@somewallet.crux', 'bitcoin');
            await expect(address).to.have.property('addressHash').equals('foobtcaddress');
        });

    });

    describe('ID Availability check', function() {
        beforeEach(function() {
            this.cc = new CruxWalletClient({
                walletClientName: 'somewallet'
            });
        });
        it('Available ID check', async function() {
            expect(await this.cc.isCruxIDAvailable('random123')).equals(true);
        });
        it('Unavailable ID check', async function() {
            expect(await this.cc.isCruxIDAvailable(this.testCruxUser2.cruxID.components.subdomain)).equals(false);
        });
    });

    it('New ID Registration works properly', async function() {
        let cc = new CruxWalletClient({
            walletClientName: 'somewallet',
            privateKey: testPrivateKeys.testPvtKey4
        });
        const initIdState = await cc.getCruxIDState();
        expect(initIdState.cruxID).to.equals(null);

        await cc.registerCruxID('newtestuser');
        const idState = await cc.getCruxIDState();
        expect(idState.cruxID).equals('newtestuser@somewallet.crux');
        expect(idState.status.status).equals(SubdomainRegistrationStatus.PENDING);
    });
    describe('Client tests with private key of pending user', async function() {
        beforeEach(function() {
            this.cc = new CruxWalletClient({
                walletClientName: 'somewallet',
                privateKey: testPrivateKeys.testPvtKey3
            });
        });
        it('Cannot register because user is already registered', async function() {
            const registerPromise = this.cc.registerCruxID('anything')
            await expect(registerPromise).to.be.eventually.rejected.with.property('errorCode', PackageErrorCode.ExistingCruxIDFound);
        });
    })
    describe('Client tests with private key of existing user', async function() {

        beforeEach(function() {
            this.cc = new CruxWalletClient({
                walletClientName: 'somewallet',
                privateKey: testPrivateKeys.testPvtKey2
            });
        });

        it('User is recovered properly from private key', async function() {
            const idState: ICruxIDState = await this.cc.getCruxIDState();
            expect(idState.cruxID!.toString()).equals(this.testCruxUser2.cruxID.toString());
        });
        it('Cannot register because user is already registered', async function() {
            const registerPromise = this.cc.registerCruxID('anything')
            await expect(registerPromise).to.be.eventually.rejected.with.property('errorCode', PackageErrorCode.ExistingCruxIDFound);
        });
        it('New address addition works properly', async function() {
            const fetchedAddressMap1 = await this.cc.getAddressMap();
            expect(fetchedAddressMap1['bitcoin']['addressHash']).equals('foobtcaddress2');

            const newAddressMap = {'bitcoin': {'addressHash': 'btcAddressXyz'}};
            await this.cc.putAddressMap(newAddressMap);
            const fetchedAddressMap2 = await this.cc.getAddressMap();
            expect(fetchedAddressMap2['bitcoin']['addressHash']).equals(newAddressMap['bitcoin']['addressHash']);

        });
        it('Partial publishing of addresses works', async function() {

            const fetchedAddressMap1 = await this.cc.getAddressMap();
            expect(fetchedAddressMap1['bitcoin']['addressHash']).equals('foobtcaddress2');

            const newAddressMap = {'bitcoin': {'addressHash': 'btcAddressAbc'}, 'invalidsymbol': {'addressHash': 'someRandomAddress'}};
            const putResult = await this.cc.putAddressMap(newAddressMap);
            expect(putResult.success).hasOwnProperty('bitcoin');
            expect(putResult.failures).hasOwnProperty('invalidsymbol');

            const fetchedAddressMap2 = await this.cc.getAddressMap();
            expect(fetchedAddressMap2['bitcoin']['addressHash']).equals(newAddressMap['bitcoin']['addressHash']);
        });
    });
    describe('Private addresses tests', async function() {

        beforeEach(function() {
            // foo123@somewallet.crux
            this.cc1 = new CruxWalletClient({
                walletClientName: 'somewallet',
                privateKey: testPrivateKeys.testPvtKey
            });

            // bar123@somewallet.crux
            this.cc2 = new CruxWalletClient({
                walletClientName: 'somewallet',
                privateKey: testPrivateKeys.testPvtKey2
            });
        });
        it('New private address addition for self and resolution works properly', async function() {
            const newAddressMap = {'bitcoin': {'addressHash': 'btcAddressXyz'}};
            await this.cc2.putPrivateAddressMap(["bar123@somewallet.crux"], newAddressMap)
            const fetchedAddress = await this.cc2.resolveCurrencyAddressForCruxID("bar123@somewallet.crux", "bitcoin");
            expect(fetchedAddress['addressHash']).equals(newAddressMap['bitcoin']['addressHash']);
        });

        it('New private address addition and resolution works properly', async function() {
            const newAddressMap = {'bitcoin': {'addressHash': 'btcAddressXyz'}};
            await this.cc1.putPrivateAddressMap(["bar123@somewallet.crux"], newAddressMap)
            const fetchedAddress = await this.cc2.resolveCurrencyAddressForCruxID("foo123@somewallet.crux", "bitcoin");
            expect(fetchedAddress['addressHash']).equals(newAddressMap['bitcoin']['addressHash']);
        });

        it('Resolution fallback to public address when no private address found', async function() {
            const newAddressMap = {'ethereum': {'addressHash': 'ethAddressXyz'}};
            await this.cc1.putPrivateAddressMap(["bar123@somewallet.crux"], newAddressMap)
            const fetchedAddress = await this.cc2.resolveCurrencyAddressForCruxID("foo123@somewallet.crux", "bitcoin");
            expect(fetchedAddress['addressHash']).equals("foobtcaddress");
        });

        it('Resolution throws AddressNotAvailable no private or public address found', async function() {
            const newAddressMap = {'ethereum': {'addressHash': 'ethAddressXyz'}};
            await this.cc1.putPrivateAddressMap(["bar123@somewallet.crux"], newAddressMap)
            const promise = this.cc2.resolveCurrencyAddressForCruxID("foo123@somewallet.crux", "tron");
            expect(promise).to.be.eventually.rejected.with.property('errorCode', PackageErrorCode.AddressNotAvailable);
        });

        it('Partial publishing of private addresses works', async function() {
            const fetchedAddressMap1 = await this.cc1.getAddressMap();
            expect(fetchedAddressMap1['bitcoin']['addressHash']).equals('foobtcaddress2');
            const barCruxIdString = "bar123@somewallet.crux";
            const newAddressMap = {'bitcoin': {'addressHash': 'btcAddressAbc'}, 'invalidsymbol': {'addressHash': 'someRandomAddress'}};
            const putResult = await this.cc1.putPrivateAddressMap([barCruxIdString], newAddressMap);
            expect(putResult.failures).eql([{
                errorCode: PackageErrorCode.CurrencyDoesNotExistInClientMapping,
                errorEntity: "invalidsymbol",
                errorMessage: ERROR_STRINGS[PackageErrorCode.CurrencyDoesNotExistInClientMapping],
            }]);
        });

        it('Partial publishing of private addresses works when some users don\'t exist', async function() {
            const fetchedAddressMap1 = await this.cc1.getAddressMap();
            expect(fetchedAddressMap1['bitcoin']['addressHash']).equals('foobtcaddress2');
            const barCruxIdString = "bar123@somewallet.crux";
            const nonexistentUser = "nonexistent@somewallet.crux"
            const newAddressMap = {'bitcoin': {'addressHash': 'btcAddressAbc'}, 'invalidsymbol': {'addressHash': 'someRandomAddress'}};
            const putResult = await this.cc1.putPrivateAddressMap([barCruxIdString, nonexistentUser], newAddressMap);

            expect(putResult.failures).eql([{
                errorCode: PackageErrorCode.CurrencyDoesNotExistInClientMapping,
                errorEntity: "invalidsymbol",
                errorMessage: ERROR_STRINGS[PackageErrorCode.CurrencyDoesNotExistInClientMapping],
            }, {
                errorCode: PackageErrorCode.UserDoesNotExist,
                errorEntity: "nonexistent@somewallet.crux",
                errorMessage: ERROR_STRINGS[PackageErrorCode.UserDoesNotExist],
            }]);
        });

    });
});

