import { expect } from 'chai';
import sinon from "sinon";
import 'mocha';
import { BlockstackCruxDomainRepository } from "../../infrastructure/implementations/blockstack-crux-domain-repository";
import { CruxSpec } from "../../core/entities/crux-spec";
import { CruxDomainId } from "../../packages/identity-utils";
import { DomainRegistrationStatus, CruxDomain } from '../../core/entities/crux-domain';
import { BasicKeyManager } from '../../infrastructure/implementations/basic-key-manager';
describe('Infrastructure Repositories Test', () => {
    let sandbox: sinon.SinonSandbox;
    before(() => { sandbox = sinon.createSandbox(); })
    afterEach(() => { sandbox.restore(); })
    describe('Testing BlockstackCruxUserRepository', () => {

        it('New CruxUser Creation', ()=>{

        })
        it('Finding a CruxUser by ID', ()=>{

        })
        it('Getting a CruxUser by ID', ()=>{

        })
        it('Getting a CruxUser by key', ()=>{

        })
        it('Saving changes to a CruxUser', ()=>{

        })

    })
    describe('Testing BlockstackCruxDomainRepository', () => {
        let blockstackCruxDomainRepository: BlockstackCruxDomainRepository;
        let getDomainRegistrationStatusStub: sinon.SinonStub;
        let getClientConfigStub: sinon.SinonStub;
        let restoreDomainStub: sinon.SinonStub;
        let putClientConfigStub: sinon.SinonStub;
        // "cruxdev" fixtures
        const cruxdevDomainString = "cruxdev";
        const cruxdevConfigSubdomainPrivateKey = "9d642ba222d8fa887c108472883d702511b9e06d004f456a78d85a740b789dd2";
        const cruxdevConfigKeyManager = new BasicKeyManager(cruxdevConfigSubdomainPrivateKey)
        const cruxdevRegistrationStatus = DomainRegistrationStatus.REGISTERED;
        const cruxdevAssetMapping = {};
        const cruxdevAssetList = [];
        const cruxdevNameserviceConfig = {};
        const cruxdevClientConfig = {
            assetMapping: cruxdevAssetMapping,
            assetList: cruxdevAssetList,
        }
        // "testcase" fixtures
        const testcaseDomainString = "testcase";
        beforeEach(() => {
            blockstackCruxDomainRepository = new BlockstackCruxDomainRepository({
                blockstackInfrastructure: CruxSpec.blockstack.infrastructure,
            })
            // @ts-ignore
            getDomainRegistrationStatusStub = sandbox.stub(blockstackCruxDomainRepository.blockstackService, 'getDomainRegistrationStatus');
            // @ts-ignore
            getClientConfigStub = sandbox.stub(blockstackCruxDomainRepository.blockstackService, 'getClientConfig');
            // @ts-ignore
            restoreDomainStub = sandbox.stub(blockstackCruxDomainRepository.blockstackService, 'restoreDomain');
            // @ts-ignore
            putClientConfigStub = sandbox.stub(blockstackCruxDomainRepository.blockstackService, 'putClientConfig');
            getDomainRegistrationStatusStub.withArgs(cruxdevDomainString).resolves(DomainRegistrationStatus.REGISTERED);
            getDomainRegistrationStatusStub.withArgs("testcase").resolves(DomainRegistrationStatus.AVAILABLE);
            getClientConfigStub.withArgs(cruxdevDomainString).resolves({assetMapping: cruxdevAssetMapping, assetList: cruxdevAssetList});
            restoreDomainStub.withArgs(sinon.match(cruxdevConfigKeyManager)).resolves(cruxdevDomainString);
        })
        describe('Finding availability of CruxDomain by DomainId', ()=>{
            it('"cruxdev" should be unavailable', async () => {
                const domainId = new CruxDomainId(cruxdevDomainString);
                const availability = await blockstackCruxDomainRepository.find(domainId);
                expect(availability).to.be.false;
                expect(getDomainRegistrationStatusStub.calledOnce).to.be.true;
                expect(getDomainRegistrationStatusStub.calledWithExactly(cruxdevDomainString)).to.be.true;
            })
            it('"testcase" should be available', async () => {
                const domainId = new CruxDomainId(testcaseDomainString);
                const availability = await blockstackCruxDomainRepository.find(domainId);
                expect(availability).to.be.true;
                expect(getDomainRegistrationStatusStub.calledOnce).to.be.true;
                expect(getDomainRegistrationStatusStub.calledWithExactly(testcaseDomainString)).to.be.true;
            })
        })
        describe('Getting the CruxDomain by DomainId', () => {
            it('"cruxdev" should resolve proper CruxDomain object', async () => {
                const domainId = new CruxDomainId(cruxdevDomainString);
                const cruxDomain = await blockstackCruxDomainRepository.get(domainId);
                expect(cruxDomain).is.instanceOf(CruxDomain);
                expect(cruxDomain.status === cruxdevRegistrationStatus).to.be.true;
                expect(cruxDomain.config).is.eql(cruxdevClientConfig);
                expect(getDomainRegistrationStatusStub.calledOnce).to.be.true;
                expect(getDomainRegistrationStatusStub.calledWithExactly(cruxdevDomainString)).to.be.true;
                expect(getClientConfigStub.calledOnce).to.be.true;
                expect(getClientConfigStub.calledWithExactly(cruxdevDomainString)).to.be.true;

            })
            it('"testcase" should resolve undefined', async () => {
                const domainId = new CruxDomainId(testcaseDomainString);
                const cruxDomain = await blockstackCruxDomainRepository.get(domainId);
                expect(cruxDomain).is.undefined;
                expect(getDomainRegistrationStatusStub.calledOnce).to.be.true;
                expect(getDomainRegistrationStatusStub.calledWithExactly(testcaseDomainString)).to.be.true;
                expect(getClientConfigStub.notCalled).to.be.true;
            })
        })
        describe('Getting a CruxDomain with configKeyManager', () => {
            it('"cruxdev" is available on the configKeyManager provided', async () => {
                const cruxDomain = await blockstackCruxDomainRepository.getWithConfigKeyManager(cruxdevConfigKeyManager);
                expect(cruxDomain).is.instanceOf(CruxDomain);
                expect(cruxDomain.status === cruxdevRegistrationStatus).to.be.true;
                expect(cruxDomain.config).is.eql(cruxdevClientConfig);
                expect(restoreDomainStub.calledOnce).to.be.true;
                expect(restoreDomainStub.calledWith(sinon.match(cruxdevConfigKeyManager))).to.be.true;
                expect(getClientConfigStub.calledOnce).to.be.true;
                expect(getClientConfigStub.calledWithExactly(cruxdevDomainString)).to.be.true;
            })
            it('No domain available on the configKeyManager provided', async () => {
                const randomKeyManager = new BasicKeyManager("392555374ccf6c13a3f0a794dc94658861fe4a1c568169eb8bdf89c421968023");
                const cruxDomain = await blockstackCruxDomainRepository.getWithConfigKeyManager(randomKeyManager);
                expect(cruxDomain).is.undefined;
                expect(restoreDomainStub.calledOnce).to.be.true;
                expect(restoreDomainStub.calledWith(sinon.match(randomKeyManager))).to.be.true;
                expect(getClientConfigStub.notCalled).to.be.true;
            })
        })
        describe('Saving changes to a CruxDomain', ()=>{
            it('returned cruxDomain object matches the edited instance given as parameter', async () => {
                const newAssetMap = {"btc": "d78c26f8-7c13-4909-bf62-57d7623f8ee8"};
                const newAssetList = [{
                    "assetId": "d78c26f8-7c13-4909-bf62-57d7623f8ee8",
                    "symbol": "BTC",
                    "name": "Bitcoin",
                    "assetType": null,
                    "decimals": 8,
                    "assetIdentifierName": null,
                    "assetIdentifierValue": null,
                    "parentAssetId": null
                }];
                const domainId = new CruxDomainId(cruxdevDomainString);
                const cruxDomain = await blockstackCruxDomainRepository.get(domainId);
                cruxDomain.config.assetMapping = newAssetMap;
                putClientConfigStub.withArgs(cruxdevDomainString, cruxDomain.config, cruxdevConfigKeyManager).resolves(cruxDomain);
                const updatedCruxDomain = await blockstackCruxDomainRepository.save(cruxDomain, cruxdevConfigKeyManager);
                expect(updatedCruxDomain).to.be.instanceOf(CruxDomain);
                expect(updatedCruxDomain.config.assetMapping['btc']).to.be.equal("d78c26f8-7c13-4909-bf62-57d7623f8ee8");
                expect(putClientConfigStub.calledOnce).to.be.true;
                expect(putClientConfigStub.calledWith(cruxdevDomainString, sinon.match({assetMapping: newAssetMap, assetList: newAssetList}), sinon.match(cruxdevConfigKeyManager))).to.be.true;
            })
        })

    })

});
