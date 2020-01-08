import 'mocha';
import sinon from "sinon";
import * as cwc from "../../application/clients/crux-wallet-client";
import {CruxWalletClient} from "../../application/clients/crux-wallet-client";
import {CruxDomain, DomainRegistrationStatus} from "../../core/entities/crux-domain";
import {CruxSpec} from "../../core/entities/crux-spec";
import {
    CruxUser,
    IAddress,
    IAddressMapping,
    ICruxUserRegistrationStatus,
    SubdomainRegistrationStatus,
    SubdomainRegistrationStatusDetail
} from "../../core/entities/crux-user";
import {IClientConfig} from "../../packages/configuration-service";
import {CruxDomainId, CruxId} from "../../packages/identity-utils";
import {InMemoryCruxDomainRepository, InMemoryCruxUserRepository} from "./test-utils";

const getMockUserRepo = async (cruxUser: CruxUser) => {
    const repo = new InMemoryCruxUserRepository()
    let createdCruxDomain = await repo.create(cruxUser.cruxID, {} as any)
    createdCruxDomain.setAddressMap(cruxUser.getAddressMap())
    repo.save(createdCruxDomain, {} as any)
    return repo
};


const getMockDomainRepo = async (cruxDomain: CruxDomain) => {
    const repo = new InMemoryCruxDomainRepository()
    let createdCruxDomain = await repo.create(cruxDomain.domainId, {} as any)
    createdCruxDomain.config = cruxDomain.config
    repo.save(cruxDomain, {} as any)
    return repo
};

const setupCruxUserGetter = async (cruxUser: CruxUser) => {
    const mockUserRepo = await getMockUserRepo(cruxUser);
    const mockRepoGetter = sinon.stub(cwc, 'getCruxUserRepository').callsFake(() => mockUserRepo as any);
};

const setupCruxDomainGetter = async (cruxDomain: CruxDomain) => {
    const mockDomainRepo = await getMockDomainRepo(cruxDomain);
    const mockRepoGetter = sinon.stub(cwc, 'getCruxDomainRepository').callsFake(() => mockDomainRepo as any);
};

const getValidCruxDomain = () => {
    const testCruxDomainId = CruxDomainId.fromString('somewallet.crux');
    const domainStatus: DomainRegistrationStatus = DomainRegistrationStatus.REGISTERED;
    const testValidDomainAssetMapping = {
        'bitcoin': 'd78c26f8-7c13-4909-bf62-57d7623f8ee8'
    };
    const testValidDomainConfig: IClientConfig = {
        assetMapping: testValidDomainAssetMapping,
        assetList: CruxSpec.globalAssetList.filter((asset) => Object.values(testValidDomainAssetMapping).includes(asset.assetId)),
    };
    return new CruxDomain(testCruxDomainId, domainStatus, testValidDomainConfig);
};

const getValidCruxUser = () => {
    const testCruxId = CruxId.fromString('foo123@testwallet.crux');
    const testAddress: IAddress = {
        'addressHash': 'foobtcaddress'
    };
    const BTC_ASSET_ID: string = 'd78c26f8-7c13-4909-bf62-57d7623f8ee8';
    const testValidAddressMap: IAddressMapping = {[BTC_ASSET_ID]: testAddress};
    const validUserRegStatus: ICruxUserRegistrationStatus = {
        'status': SubdomainRegistrationStatus.DONE,
        'statusDetail': SubdomainRegistrationStatusDetail.DONE
    };

    return new CruxUser(testCruxId, testValidAddressMap, validUserRegStatus);
};

describe('Client Tests', function() {
    this.timeout(100000)
    describe('CruxWalletClient Tests', () => {



        it('Translate assetIdAddressMap to symbolAddressMap', async () => {
            const testCruxDomain = getValidCruxDomain()
            const testCruxUser = getValidCruxUser()
            await setupCruxDomainGetter(testCruxDomain);
            await setupCruxUserGetter(testCruxUser);

            let cc = new CruxWalletClient({
                walletClientName: 'somewallet'
            });

            const address = await cc.resolveCurrencyAddressForCruxID(testCruxUser.cruxID.toString(), 'bitcoin')
            console.log(address)

        });

    });
});
