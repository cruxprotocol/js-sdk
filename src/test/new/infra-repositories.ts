import { expect } from 'chai';
import sinon from "sinon";
import 'mocha';
import { BlockstackCruxDomainRepository } from "../../infrastructure/implementations/blockstack-crux-domain-repository";
import { BlockstackCruxUserRepository } from "../../infrastructure/implementations/blockstack-crux-user-repository";
import { CruxSpec } from "../../core/entities/crux-spec";
import { CruxDomainId, CruxId, IdTranslator, BlockstackId } from "../../packages/identity-utils";
import { DomainRegistrationStatus, CruxDomain } from '../../core/entities/crux-domain';
import { BasicKeyManager } from '../../infrastructure/implementations/basic-key-manager';
import * as blkStkService from "../../infrastructure/services/blockstack-service";
import { IAddressMapping, CruxUser, SubdomainRegistrationStatus, SubdomainRegistrationStatusDetail } from '../../core/entities/crux-user';
import { boolean } from '@mojotech/json-type-validation';
describe('Infrastructure Repositories Test', () => {
    let sandbox: sinon.SinonSandbox;
    let mockBlockstackService;
    before(() => { sandbox = sinon.createSandbox(); })
    beforeEach(() => {
        mockBlockstackService = {
            getDomainRegistrationStatus: sandbox.stub().throws("unhandled in mocks"),
            getClientConfig: sandbox.stub().withArgs(cruxdevDomainString).resolves({assetMapping: cruxdevAssetMapping, assetList: cruxdevAssetList}),
            restoreDomain: restoreDomainStub,
        }
        sandbox.stub(blkStkService, 'BlockstackService').returns(mockBlockstackService);;
    })
    afterEach(() => { sandbox.restore(); })
    describe('Testing BlockstackCruxUserRepository', () => {
        let blockstackCruxUserRepository: BlockstackCruxUserRepository;
        // fixtures
        const walletClientName = "cruxdev";
        const cruxdevDomainId = new CruxDomainId(walletClientName);
        const testUserCruxIdString = "mascot6699@cruxdev.crux";
        const testUserCruxId = CruxId.fromString(testUserCruxIdString);
        const testUserBlockstackId = IdTranslator.cruxIdToBlockstackId(testUserCruxId);
        const testUserPrivKey = "cdf2d276caf0c9c34258ed6ebd0e60e0e8b3d9a7b8a9a717f2e19ed9b37f7c6f";
        const testUserKeyManager = new BasicKeyManager(testUserPrivKey);

        const newUserCruxId = CruxId.fromString("newuser@cruxdev.crux");
        const unregisteredCruxId = CruxId.fromString("alice@cruxdev.crux");
        
        const randomPrivKey = "95611bcefd15913cba2c673ef61ba56d1a48de1d3df383222ddcb715e41e8ffb";
        const randomKeyManager = new BasicKeyManager(randomPrivKey);

        const wallet_btc_address = "1HX4KvtPdg9QUYwQE1kNqTAjmNaDG7w82V"
        const wallet_eth_address = "0x0a2311594059b468c9897338b027c8782398b481"
        const wallet_trx_address = "TG3iFaVvUs34SGpWq8RG9gnagDLTe1jdyz"
        const wallet_xrp_address = "rpfKAA2Ezqoq5wWo3XENdLYdZ8YGziz48h"
        const wallet_xrp_sec_identifier = "12345"
        const sampleAddressMap: IAddressMapping = {
            btc: {
                addressHash: wallet_btc_address
            },
            eth: {
                addressHash: wallet_eth_address
            },
            trx: {
                addressHash: wallet_trx_address
            },
            xrp: {
                addressHash: wallet_xrp_address,
                secIdentifier: wallet_xrp_sec_identifier
            }
        };

        beforeEach(() => {
            const isCruxIdAvailableStub = sandbox.stub().throws("Unhandled in mocks");
            isCruxIdAvailableStub.withArgs(testUserCruxId).resolves(false);
            isCruxIdAvailableStub.withArgs(newUserCruxId).resolves(true);

            const getBlockstackIdFromKeyManagerStub = sandbox.stub().throws("Unhandled in mocks");
            getBlockstackIdFromKeyManagerStub.withArgs(testUserKeyManager, cruxdevDomainId).resolves(BlockstackId.fromString("mascot6699.cruxdev_crux.id"));
            getBlockstackIdFromKeyManagerStub.withArgs(randomKeyManager, cruxdevDomainId).resolves(undefined);

            mockBlockstackService = {
                isCruxIdAvailable: isCruxIdAvailableStub,
                getBlockstackIdFromKeyManager: getBlockstackIdFromKeyManagerStub,
                registerCruxId: sandbox.stub().withArgs(newUserCruxId, randomKeyManager).resolves({
                    status: SubdomainRegistrationStatus.PENDING,
                    statusDetail: SubdomainRegistrationStatusDetail.PENDING_REGISTRAR
                }),
                getCruxIdRegistrationStatus: sandbox.stub().withArgs(testUserCruxId).resolves({
                    status: SubdomainRegistrationStatus.DONE,
                    statusDetail: SubdomainRegistrationStatusDetail.DONE
                }),
                getAddressMap: sandbox.stub().withArgs(testUserBlockstackId).resolves({
                    "d78c26f8-7c13-4909-bf62-57d7623f8ee8": {
                        "addressHash":"1HX4KvtPdg9QUYwQE1kNqTAjmNaDG7w82V",
                        "secIdentifier":""
                    }
                })
            }
            sandbox.stub(blkStkService, 'BlockstackService').returns(mockBlockstackService);
            blockstackCruxUserRepository = new BlockstackCruxUserRepository({
                blockstackInfrastructure: CruxSpec.blockstack.infrastructure,
            })
        })
        it('New CruxUser Creation', async () => {
            const cruxUser = await blockstackCruxUserRepository.create(newUserCruxId, randomKeyManager);
            expect(cruxUser).is.instanceOf(CruxUser);
            expect(cruxUser.cruxID).is.eql(newUserCruxId);
            expect(cruxUser.registrationStatus).is.eql({
                status: SubdomainRegistrationStatus.PENDING,
                statusDetail: SubdomainRegistrationStatusDetail.PENDING_REGISTRAR
            })
            expect(mockBlockstackService.registerCruxId.calledOnceWithExactly(newUserCruxId, CruxSpec.blockstack.infrastructure.gaiaHub, randomKeyManager)).to.be.true;
        })
        it('Finding an existing CruxUser by ID', async ()=>{
            const cruxUserAvailable = await blockstackCruxUserRepository.isCruxIdAvailable(testUserCruxId);
            expect(cruxUserAvailable).is.eql(false);
        })
        it('Finding a new CruxUser by ID', async ()=>{
            const cruxUserAvailable = await blockstackCruxUserRepository.isCruxIdAvailable(newUserCruxId);
            expect(cruxUserAvailable).is.eql(true);
        })
        it('Getting registered CruxUser by ID', async ()=>{
            const cruxUser = await blockstackCruxUserRepository.getByCruxId(testUserCruxId);
            expect(cruxUser).is.instanceOf(CruxUser);
            expect(cruxUser.cruxID).is.eql(testUserCruxId);
            expect(cruxUser.registrationStatus).is.eql({
                status: SubdomainRegistrationStatus.DONE,
                statusDetail: SubdomainRegistrationStatusDetail.DONE
            })
            expect(mockBlockstackService.getCruxIdRegistrationStatus.calledOnceWithExactly(testUserCruxId)).to.be.true;
        })
        it('Getting registered CruxUser by ID with tag', async ()=>{
            const cruxUser = await blockstackCruxUserRepository.getByCruxId(testUserCruxId, "testtag");
            expect(cruxUser).is.instanceOf(CruxUser);
            expect(cruxUser.cruxID).is.eql(testUserCruxId);
            expect(cruxUser.registrationStatus).is.eql({
                status: SubdomainRegistrationStatus.DONE,
                statusDetail: SubdomainRegistrationStatusDetail.DONE
            });
            expect(cruxUser.getAddressMap()).is.eql({
                "d78c26f8-7c13-4909-bf62-57d7623f8ee8": {
                    "addressHash":"1HX4KvtPdg9QUYwQE1kNqTAjmNaDG7w82V",
                    "secIdentifier":""
                }
            });
            expect(mockBlockstackService.getCruxIdRegistrationStatus.calledOnceWithExactly(testUserCruxId)).to.be.true;
        })
        it('Getting unregistered CruxUser by ID', async ()=>{
            mockBlockstackService.isCruxIdAvailable = sandbox.stub().resolves(true);
            const cruxUser = await blockstackCruxUserRepository.getByCruxId(unregisteredCruxId);
            expect(cruxUser).is.eql(undefined);
        })
        it('Getting a CruxUser by key', async ()=>{
            mockBlockstackService.isCruxIdAvailable = sandbox.stub().resolves(false);
            const cruxUser = await blockstackCruxUserRepository.getWithKey(testUserKeyManager, cruxdevDomainId);
            expect(cruxUser).is.instanceOf(CruxUser);
            expect(cruxUser.registrationStatus).is.eql({
                status: SubdomainRegistrationStatus.DONE,
                statusDetail: SubdomainRegistrationStatusDetail.DONE
            })
        })
    })
    describe('Testing BlockstackCruxDomainRepository', () => {
        let blockstackCruxDomainRepository: BlockstackCruxDomainRepository;
        // "cruxdev" fixtures
        const cruxdevDomainString = "cruxdev";
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
        // "testcase" fixtures
        const testcaseDomainString = "testcase";
        beforeEach(() => {
            const getDomainRegistrationStatusStub = sandbox.stub().throws("unhandled in mocks");
            getDomainRegistrationStatusStub.withArgs(cruxdevDomainString).resolves(DomainRegistrationStatus.REGISTERED);
            getDomainRegistrationStatusStub.withArgs("testcase").resolves(DomainRegistrationStatus.AVAILABLE);

            const restoreDomainStub = sandbox.stub().resolves(undefined);
            restoreDomainStub.withArgs(sinon.match(cruxdevConfigKeyManager)).resolves(cruxdevDomainString);

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
