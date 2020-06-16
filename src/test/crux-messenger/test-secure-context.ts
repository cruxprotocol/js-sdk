import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import 'mocha';
import {SecureContext} from "../../core/domain-services";
import {BasicKeyManager, cruxPaymentProtocol} from "../../infrastructure/implementations";
import {InMemStorage} from "../../packages";
import {InMemoryCruxUserRepository, MockUserStore, patchMissingDependencies} from "../test-utils";
import {getMockUserBar123CSTestWallet, getMockUserFoo123CSTestWallet, getMockUserFooBar123CSTestWallet} from "./utils";

patchMissingDependencies();

chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;


describe('Test Secure Context', function() {
    beforeEach(function(){
        const userStore = new MockUserStore();
        const user1Data = getMockUserFoo123CSTestWallet();
        const user2Data = getMockUserBar123CSTestWallet();
        this.user1Data = user1Data;
        this.user2Data = user2Data;
        userStore.store(user1Data.cruxUser);
        userStore.store(user2Data.cruxUser);
        this.inmemUserRepo = new InMemoryCruxUserRepository(userStore);
        this.selfIdClaimUser1 = {
            cruxId: this.user1Data.cruxUser.cruxID,
            keyManager: new BasicKeyManager(this.user1Data.pvtKey)
        }
        this.selfIdClaimUser2 = {
            cruxId: this.user2Data.cruxUser.cruxID,
            keyManager: new BasicKeyManager(this.user2Data.pvtKey)
        }
    })
    describe('Foo', function() {
        beforeEach(function() {
            this.secureContextUser1 = new SecureContext(new InMemStorage(), this.selfIdClaimUser1, this.inmemUserRepo);
            this.secureContextUser2 = new SecureContext(new InMemStorage(), this.selfIdClaimUser2, this.inmemUserRepo);
        })
        it('Valid messages', async function() {
            const msg = "HELLO";
            const foo = await this.secureContextUser1.processOutgoing(msg, this.user2Data.cruxUser.cruxID);
            const decrypted = await this.secureContextUser2.processIncoming(foo);
            expect(decrypted.data).to.equals(msg);

        });


    });



})
