import { expect } from 'chai';
import sinon from "sinon";
import 'mocha';
import { BlockstackCruxDomainRepository } from "../../infrastructure/implementations/blockstack-crux-domain-repository";
import { CruxSpec } from "../../core/entities/crux-spec";
import { CruxDomainId } from "../../packages/identity-utils";
import { DomainRegistrationStatus, CruxDomain } from '../../core/entities/crux-domain';
import { BasicKeyManager } from '../../infrastructure/implementations/basic-key-manager';
import * as blkStkService from "../../infrastructure/services/blockstack-service";
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
        let mockBlockstackService;
        let blockstackCruxDomainRepository: BlockstackCruxDomainRepository;
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
            const getDomainRegistrationStatusStub = sandbox.stub();
            getDomainRegistrationStatusStub.withArgs(cruxdevDomainString).resolves(DomainRegistrationStatus.REGISTERED);
            getDomainRegistrationStatusStub.withArgs("testcase").resolves(DomainRegistrationStatus.AVAILABLE);

            const restoreDomainStub = sandbox.stub().resolves(undefined);
            restoreDomainStub.withArgs(sinon.match(cruxdevConfigKeyManager)).resolves(cruxdevDomainString);
            
            mockBlockstackService = {
                getDomainRegistrationStatus: getDomainRegistrationStatusStub,
                getClientConfig: sandbox.stub().withArgs(cruxdevDomainString).resolves({assetMapping: cruxdevAssetMapping, assetList: cruxdevAssetList}),
                restoreDomain: restoreDomainStub,
            }
            sandbox.stub(blkStkService, 'BlockstackService').returns(mockBlockstackService);;
            blockstackCruxDomainRepository = new BlockstackCruxDomainRepository({
                blockstackInfrastructure: CruxSpec.blockstack.infrastructure,
            })
        })
        describe('Finding availability of CruxDomain by DomainId', ()=>{
            it('"cruxdev" should be unavailable', async () => {
                const domainId = new CruxDomainId(cruxdevDomainString);
                const availability = await blockstackCruxDomainRepository.find(domainId);
                expect(availability).to.be.false;
                expect(mockBlockstackService.getDomainRegistrationStatus.calledOnce).to.be.true;
                expect(mockBlockstackService.getDomainRegistrationStatus.calledWithExactly(cruxdevDomainString)).to.be.true;
            })
            it('"testcase" should be available', async () => {
                const domainId = new CruxDomainId(testcaseDomainString);
                const availability = await blockstackCruxDomainRepository.find(domainId);
                expect(availability).to.be.true;
                expect(mockBlockstackService.getDomainRegistrationStatus.calledOnce).to.be.true;
                expect(mockBlockstackService.getDomainRegistrationStatus.calledWithExactly(testcaseDomainString)).to.be.true;
            })
        })
        describe('Getting the CruxDomain by DomainId', () => {
            it('"cruxdev" should resolve proper CruxDomain object', async () => {
                const domainId = new CruxDomainId(cruxdevDomainString);
                const cruxDomain = await blockstackCruxDomainRepository.get(domainId);
                expect(cruxDomain).is.instanceOf(CruxDomain);
                expect(cruxDomain.status === cruxdevRegistrationStatus).to.be.true;
                expect(cruxDomain.config).is.eql(cruxdevClientConfig);
                expect(mockBlockstackService.getDomainRegistrationStatus.calledOnce).to.be.true;
                expect(mockBlockstackService.getDomainRegistrationStatus.calledWithExactly(cruxdevDomainString)).to.be.true;
                expect(mockBlockstackService.getClientConfig.calledOnce).to.be.true;
                expect(mockBlockstackService.getClientConfig.calledWithExactly(cruxdevDomainString)).to.be.true;

            })
            it('"testcase" should resolve undefined', async () => {
                const domainId = new CruxDomainId(testcaseDomainString);
                const cruxDomain = await blockstackCruxDomainRepository.get(domainId);
                expect(cruxDomain).is.undefined;
                expect(mockBlockstackService.getDomainRegistrationStatus.calledOnce).to.be.true;
                expect(mockBlockstackService.getDomainRegistrationStatus.calledWithExactly(testcaseDomainString)).to.be.true;
                expect(mockBlockstackService.getClientConfig.notCalled).to.be.true;
            })
        })
        describe('Getting a CruxDomain with configKeyManager', () => {
            it('"cruxdev" is available on the configKeyManager provided', async () => {
                const cruxDomain = await blockstackCruxDomainRepository.getWithConfigKeyManager(cruxdevConfigKeyManager);
                expect(cruxDomain).is.instanceOf(CruxDomain);
                expect(cruxDomain.status === cruxdevRegistrationStatus).to.be.true;
                expect(cruxDomain.config).is.eql(cruxdevClientConfig);
                expect(mockBlockstackService.restoreDomain.calledOnce).to.be.true;
                expect(mockBlockstackService.restoreDomain.calledWith(sinon.match(cruxdevConfigKeyManager))).to.be.true;
                expect(mockBlockstackService.getClientConfig.calledOnce).to.be.true;
                expect(mockBlockstackService.getClientConfig.calledWithExactly(cruxdevDomainString)).to.be.true;
            })
            it('No domain available on the configKeyManager provided', async () => {
                const randomKeyManager = new BasicKeyManager("392555374ccf6c13a3f0a794dc94658861fe4a1c568169eb8bdf89c421968023");
                const cruxDomain = await blockstackCruxDomainRepository.getWithConfigKeyManager(randomKeyManager);
                expect(cruxDomain).is.undefined;
                expect(mockBlockstackService.restoreDomain.calledOnce).to.be.true;
                expect(mockBlockstackService.restoreDomain.calledWith(sinon.match(randomKeyManager))).to.be.true;
                expect(mockBlockstackService.getClientConfig.notCalled).to.be.true;
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
                mockBlockstackService.putClientConfig = sandbox.stub().withArgs(cruxdevDomainString, cruxDomain.config, cruxdevConfigKeyManager).resolves(cruxDomain);
                const updatedCruxDomain = await blockstackCruxDomainRepository.save(cruxDomain, cruxdevConfigKeyManager);
                expect(updatedCruxDomain).to.be.instanceOf(CruxDomain);
                expect(updatedCruxDomain.config.assetMapping['btc']).to.be.equal("d78c26f8-7c13-4909-bf62-57d7623f8ee8");
                expect(mockBlockstackService.putClientConfig.calledOnce).to.be.true;
                expect(mockBlockstackService.putClientConfig.calledWith(cruxdevDomainString, sinon.match({assetMapping: newAssetMap, assetList: newAssetList}), sinon.match(cruxdevConfigKeyManager))).to.be.true;
            })
        })

    })

});
