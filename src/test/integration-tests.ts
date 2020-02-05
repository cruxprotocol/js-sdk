import 'mocha';
import chaiAsPromised from "chai-as-promised";
import * as chai from "chai";
import { CruxWalletClient, ICruxWalletClientOptions } from '../application/clients/crux-wallet-client';
import { CruxId } from '../packages/identity-utils';
import { IAddress, SubdomainRegistrationStatus, SubdomainRegistrationStatusDetail } from '../core';
chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;

describe("CruxWalletClient integration tests", () => {
    let cruxWalletClient: CruxWalletClient;
    // fixtures
    const testCruxId: CruxId = CruxId.fromString("test_crux_id@cruxdev.crux");
    const btcAddress: IAddress = {addressHash: "1HX4KvtPdg9QUYwQE1kNqTAjmNaDG7w82V"};
    describe("CruxWalletClient without privateKey", () => {
        before(() => {
            // initialisation
            const cruxWalletClientOptions: ICruxWalletClientOptions = {
                walletClientName: "cruxdev",
            }
            cruxWalletClient = new CruxWalletClient(cruxWalletClientOptions);
        })
        after(() => {
            cruxWalletClient = undefined;
        })
        it("check cruxId availability", async () => {
            const cruxIdAvailability = await cruxWalletClient.isCruxIDAvailable(testCruxId.components.subdomain);
            expect(cruxIdAvailability).to.be.false;
        })
        it("resolve currency address for testCruxId", async () => {
            const resolvedAddress = await cruxWalletClient.resolveCurrencyAddressForCruxID(testCruxId.toString(), "btc");
            expect(resolvedAddress).to.be.eql(btcAddress);
        })
    })
    describe("CruxWalletClient with testPrivateKey (registered)", () => {
        before(() => {
            // initialisation
            const cruxWalletClientOptions: ICruxWalletClientOptions = {
                walletClientName: "cruxdev",
                privateKey: "L3ugweKa2xz4hbe7528qmm3Dvr9xEhHw7zdhk9zRgtRhmn1nrcHB",
            }
            cruxWalletClient = new CruxWalletClient(cruxWalletClientOptions);
        })
        after(() => {
            cruxWalletClient = undefined;
        })
        it("get testCruxId registration status", async () => {
            const cruxIdState = await cruxWalletClient.getCruxIDState();
            expect(cruxIdState).to.be.object;
            expect(cruxIdState.cruxID).to.be.equal(testCruxId.toString())
            expect(cruxIdState.status.status).to.be.equal(SubdomainRegistrationStatus.DONE);
            expect(cruxIdState.status.statusDetail).to.be.equal(SubdomainRegistrationStatusDetail.DONE);
        })
        it("getAddressMap for the testCruxId", async () => {
            const resolvedAddressMap = await cruxWalletClient.getAddressMap();
            expect(resolvedAddressMap).to.be.eql({"btc": btcAddress});
        })
        it("putAddressMap for the testCruxId")
    })
    describe("CruxWalletClient with newPrivateKey (unregistered)", () => {
        // TODO: require mocking the registration flow
        // fixtures
        const newPrivateKey = "L55gyEaVgR2DtP3ssSxYx7MV3VJkScCrRduJe7FPuJChCfpb629n";
        const newCruxId: CruxId = CruxId.fromString("new_crux_id@cruxdev.crux");
        before(() => {
            // initialisation
            const cruxWalletClientOptions: ICruxWalletClientOptions = {
                walletClientName: "cruxdev",
                privateKey: newPrivateKey,
            }
            const cruxWalletClient = new CruxWalletClient(cruxWalletClientOptions);
        })
        after(() => {
            cruxWalletClient = undefined;
        })
        it("check cruxId availability", async () => {
            const cruxIdAvailability = await cruxWalletClient.isCruxIDAvailable(newCruxId.components.subdomain);
            expect(cruxIdAvailability).to.be.true;
        })
        it("register a newCruxId", async () => {
            // const registrationPromise = cruxWalletClient.registerCruxID(newCruxId.components.subdomain);
            // expect(registrationPromise).to.be.eventually.resolved;
        })
        it("get newCruxId registration status")
        it("getAddressMap for the testCruxId")
        it("putAddressMap for the testCruxId")
    })
})
