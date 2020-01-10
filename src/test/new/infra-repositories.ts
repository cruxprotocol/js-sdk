import { expect } from 'chai';
import sinon from "sinon";
import 'mocha';
import { BlockstackCruxDomainRepository } from "../../infrastructure/implementations/blockstack-crux-domain-repository";
import { CruxSpec } from "../../core/entities/crux-spec";
import { CruxDomainId } from "../../packages/identity-utils";
import { DomainRegistrationStatus, CruxDomain } from '../../core/entities/crux-domain';
import { BasicKeyManager } from '../../infrastructure/implementations/basic-key-manager';
import * as blkStkService from "../../infrastructure/services/blockstack-service";
import * as gs from "../../infrastructure/services/gaia-service";
describe('Infrastructure Repositories Test', () => {
    let sandbox: sinon.SinonSandbox;
    let mockBlockstackService;
    let mockGaiaService;
    let staticMocksBlockstackService;
    let staticMocksGaiaService;
    before(() => { sandbox = sinon.createSandbox(); })
    beforeEach(() => {
        // mocking static methods
        staticMocksBlockstackService = {
            getRegisteredBlockstackNamesByAddress: sandbox.stub(blkStkService.BlockstackService, 'getRegisteredBlockstackNamesByAddress').throws("unhandled in getRegisteredBlockstackNamesByAddress mocks"),
            getNameDetails: sandbox.stub(blkStkService.BlockstackService, 'getNameDetails').throws("unhandled in getNameDetails mocks"),
            getGaiaHubFromZonefile: sandbox.stub(blkStkService.BlockstackService, 'getGaiaHubFromZonefile').throws("unhandled in getGaiaHubFromZonefile mocks"),
            getDomainRegistrationStatusFromNameDetails: sandbox.stub(blkStkService.BlockstackService, 'getDomainRegistrationStatusFromNameDetails').throws("unhandled in getDomainRegistrationStatusFromNameDetails mocks"),
            getCruxUserRegistrationStatusFromSubdomainStatus: sandbox.stub(blkStkService.BlockstackService, 'getCruxUserRegistrationStatusFromSubdomainStatus').throws("unhandled in getCruxUserRegistrationStatusFromSubdomainStatus mocks"),
        }
        staticMocksGaiaService = {
            getGaiaReadUrl: sandbox.stub(gs.GaiaService, 'getGaiaReadUrl').throws("unhandled in getGaiaReadUrl mocks"),
            getContentFromGaiaHub: sandbox.stub(gs.GaiaService, 'getContentFromGaiaHub').throws("unhandled in getContentFromGaiaHub mocks"),
        }
        // mocking public methods
        mockBlockstackService = {
            getNameDetails: sandbox.stub().throws("unhandled in getNameDetails mocks"),
            getGaiaHub: sandbox.stub().throws("unhandled in getGaiaHub mocks"),
            getDomainRegistrationStatus: sandbox.stub().throws("unhandled in getDomainRegistrationStatus mocks"),
            getCruxDomainIdWithConfigKeyManager: sandbox.stub().throws("unhandled in getCruxDomainIdWithConfigKeyManager mocks"),
            getCruxIdWithKeyManager: sandbox.stub().throws("unhandled in getCruxIdWithKeyManager mocks"),
            isCruxIdAvailable: sandbox.stub().throws("unhandled in isCruxIdAvailable mocks"),
            registerCruxId: sandbox.stub().throws("unhandled in registerCruxId mocks"),
            getCruxIdRegistrationStatus: sandbox.stub().throws("unhandled in getCruxIdRegistrationStatus mocks"),
        }
        mockGaiaService = {
            getContentFromGaiaHub: sandbox.stub().throws("unhandled in getContentFromGaiaHub mocks"),
            uploadContentToGaiaHub: sandbox.stub().throws("unhandled in uploadContentToGaiaHub mocks"),
            connectToGaiaHubAsync: sandbox.stub().throws("unhandled in connectToGaiaHubAsync mocks"),
            makeV1GaiaAuthTokenAsync: sandbox.stub().throws("unhandled in makeV1GaiaAuthTokenAsync mocks"),
            generateContentTokenFileAsync: sandbox.stub().throws("unhandled in generateContentTokenFileAsync mocks"),
        }
        sandbox.stub(blkStkService, 'BlockstackService').returns(mockBlockstackService);
        sandbox.stub(gs, 'GaiaService').returns(mockGaiaService);
    })
    afterEach(() => { sandbox.restore(); })
    describe('Testing BlockstackCruxUserRepository', () => {

        it('New CruxUser Creation', () => {

        })
        it('Finding a CruxUser by ID', () => {

        })
        it('Getting a CruxUser by ID', () => {

        })
        it('Getting a CruxUser by key', () => {

        })
        it('Saving changes to a CruxUser', () => {

        })

    })
    describe('Testing BlockstackCruxDomainRepository', () => {
        let blockstackCruxDomainRepository: BlockstackCruxDomainRepository;
        // fixtures
        const cruxGaiaHub = "https://hub.cruxpay.com";
        // "cruxdev" fixtures
        const cruxdevDomainString = "cruxdev";
        const cruxdevCruxDomainId = new CruxDomainId(cruxdevDomainString);
        const cruxdevConfigSubdomainPrivateKey = "d4a7eab17471d190a0d6cfa00546dceeac88f333b8a2d16fb4464e1e57ac188f";    // random-private-key;
        const cruxdevConfigKeyManager = new BasicKeyManager(cruxdevConfigSubdomainPrivateKey)
        const cruxdevRegistrationStatus = DomainRegistrationStatus.REGISTERED;
        const cruxdevAssetMapping = {};
        const cruxdevAssetList = [];
        const cruxdevNameserviceConfig = {};
        const cruxdevClientConfig = {
            assetMapping: cruxdevAssetMapping,
            assetList: cruxdevAssetList,
        }
        const cruxdevConfigNameDetails = {
            "address": "1ATf5YwcEARWMCZdS8x3BXmkodkvnMW4Tf",
            "blockchain": "bitcoin",
            "did": "did:stack:v0:SWkf7PikxXchsWM5yZw7jRvKTQzMcdb5Pc-0",
            "last_txid": "bfa29d44fd31e4307c9fc0229964aaec1a6efc014e4c94681e2372f5f7d474ec",
            "status": "registered_subdomain",
            "zonefile": "$ORIGIN _config\n$TTL 3600\n_https._tcp URI 10 1 https://hub.cruxpay.com",
            "zonefile_hash": "776172a0bc8400a4046d0325dd87e78b48a2f66b"
        }
        // "testcase" fixtures
        const testcaseDomainString = "testcase";
        const testcaseCruxDomainId = new CruxDomainId(testcaseDomainString);
        beforeEach(() => {
            // mock public methods
            mockBlockstackService.getDomainRegistrationStatus.withArgs(cruxdevCruxDomainId).resolves(DomainRegistrationStatus.REGISTERED);
            mockBlockstackService.getDomainRegistrationStatus.withArgs(testcaseCruxDomainId).resolves(DomainRegistrationStatus.AVAILABLE);
            mockBlockstackService.getCruxDomainIdWithConfigKeyManager.withArgs(sinon.match(cruxdevConfigKeyManager)).resolves(cruxdevCruxDomainId);
            blockstackCruxDomainRepository = new BlockstackCruxDomainRepository({
                blockstackInfrastructure: CruxSpec.blockstack.infrastructure,
            })
        })
        describe('Finding availability of CruxDomain by DomainId', () => {
            it('"cruxdev" should be unavailable', async () => {
                const availability = await blockstackCruxDomainRepository.find(cruxdevCruxDomainId);
                expect(availability).to.be.false;
                expect(mockBlockstackService.getDomainRegistrationStatus.calledOnce).to.be.true;
                expect(mockBlockstackService.getDomainRegistrationStatus.calledWithExactly(cruxdevCruxDomainId)).to.be.true;
            })
            it('"testcase" should be available', async () => {
                const availability = await blockstackCruxDomainRepository.find(testcaseCruxDomainId);
                expect(availability).to.be.true;
                expect(mockBlockstackService.getDomainRegistrationStatus.calledOnce).to.be.true;
                expect(mockBlockstackService.getDomainRegistrationStatus.calledWithExactly(testcaseCruxDomainId)).to.be.true;
            })
        })
        describe('Getting the CruxDomain by DomainId', () => {
            it('"cruxdev" should resolve proper CruxDomain object', async () => {
                // mocks
                mockBlockstackService.getNameDetails.resolves(cruxdevConfigNameDetails);
                mockBlockstackService.getGaiaHub.resolves(cruxGaiaHub);
                mockGaiaService.getContentFromGaiaHub.resolves(cruxdevClientConfig);
                // call
                const cruxDomain = await blockstackCruxDomainRepository.get(cruxdevCruxDomainId);
                // expectations
                expect(cruxDomain).is.instanceOf(CruxDomain);
                expect(cruxDomain.status === cruxdevRegistrationStatus).to.be.true;
                expect(cruxDomain.config).is.eql(cruxdevClientConfig);
                expect(mockBlockstackService.getDomainRegistrationStatus.calledOnceWithExactly(cruxdevCruxDomainId)).to.be.true;
                expect(mockBlockstackService.getNameDetails.calledOnce).to.be.true;
                expect(mockBlockstackService.getGaiaHub.calledOnce).to.be.true;
                expect(mockGaiaService.getContentFromGaiaHub.calledOnceWithExactly(cruxdevConfigNameDetails.address, "cruxdev_client-config.json")).to.be.true;
            })
            it('"testcase" should resolve undefined', async () => {
                const cruxDomain = await blockstackCruxDomainRepository.get(testcaseCruxDomainId);
                expect(cruxDomain).is.undefined;
                expect(mockBlockstackService.getDomainRegistrationStatus.calledOnce).to.be.true;
                expect(mockBlockstackService.getDomainRegistrationStatus.calledWithExactly(testcaseCruxDomainId)).to.be.true;
                expect(mockBlockstackService.getNameDetails.notCalled).to.be.true;
                expect(mockBlockstackService.getGaiaHub.notCalled).to.be.true;
                expect(mockGaiaService.getContentFromGaiaHub.notCalled).to.be.true;
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
        describe('Saving changes to a CruxDomain', () => {
            it('returned cruxDomain object matches the edited instance given as parameter', async () => {
                const newAssetMap = { "btc": "d78c26f8-7c13-4909-bf62-57d7623f8ee8" };
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
                expect(mockBlockstackService.putClientConfig.calledWith(cruxdevDomainString, sinon.match({ assetMapping: newAssetMap, assetList: newAssetList }), sinon.match(cruxdevConfigKeyManager))).to.be.true;
            })
        })

    })

});
