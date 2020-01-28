import { expect } from 'chai';
import sinon from "sinon";
import { BlockstackNamingServiceApiClient, BlockstackSubdomainRegistrarApiClient } from "../infrastructure/services/api-clients";
import * as utils from '../packages/utils';
import { BlockstackDomainId } from '../packages/identity-utils';

describe('API Clients Test', () => {
    let sandbox: sinon.SinonSandbox;
    let mockHttpJSONRequest: sinon.SinonStub;
    before(() => { sandbox = sinon.createSandbox(); })
    beforeEach(() => {
        mockHttpJSONRequest = sandbox.stub(utils, 'httpJSONRequest').throws("httpJSONRequest unhandled in mocks")
    })
    afterEach(() => { sandbox.restore(); })
    describe('BNS API Tests', () => {
        // inputs
        const bnsNode = "https://core.blockstack.org/";
        const address = "17vkTRWLLZrKunkpgSro1ADtZd2yw4uig2";
        const testBlockstackName = "foo@test_wallet.crux";
        const tag = "test_tag";
        it('getNameByAddress', async () => {
            // mocks
            const options = {
                baseUrl: 'https://core.blockstack.org/',
                json: true,
                method: "GET",
                url: `/v1/addresses/bitcoin/17vkTRWLLZrKunkpgSro1ADtZd2yw4uig2`,
            }
            let namesOwnedByAddress = {
                "names": [
                    "user.wallet_crux.id"
                    ]
            }
            mockHttpJSONRequest.withArgs(options).resolves(namesOwnedByAddress);

            // calling the method
            const name = await BlockstackNamingServiceApiClient.getNamesByAddress(bnsNode, address);

            // run expectations
            expect(name).to.be.eql(namesOwnedByAddress)
            })
        it('getNameDetails', async () => {
            // mocks
            const options = {
                baseUrl: 'https://core.blockstack.org/',
                json: true,
                method: "GET",
                qs: null,
                url: `/v1/names/foo@test_wallet.crux`,
            }
            let nameDetails = {
                "status": "registered_subdomain",
                "zonefile": "$ORIGIN foo\n$TTL 3600\n_https._tcp URI 10 1 https://hub.cruxpay.com",
                "blockchain": "bitcoin",
                "last_txid": "ca62ea1f9759f6d5570f9533b27b7c5f09df7b0cc1f7ec4b70bfdee0814832db",
                "did": "did:stack:v0:SUDkVGHV4w3XS6YHDsqsZ4NTDQGQhDBdqu-0",
                "address": "17vkTRWLLZrKunkpgSro1ADtZd2yw4uig2",
                "zonefile_hash": "96ba3fd3253add05b02abddfd36480c39fdaa7b0"
            }
            mockHttpJSONRequest.resolves(nameDetails);

            // calling the method
            const name = await BlockstackNamingServiceApiClient.getNameDetails(bnsNode, testBlockstackName, tag, undefined);

            // run expectations
            expect(name).to.be.eql(nameDetails)
            })
        });
    describe('Subdomain API Tests', () => {
        const user = 'testUser';
        const ownerAdderss = '17vkTRWLLZrKunkpgSro1ADtZd2yw4uig2';
        const baseUrl = 'https://registrar.cruxpay.com/';
        const blockstackDomainId = BlockstackDomainId.fromString('testWallet_crux.id');
        let blockstackSubdomainRegistrarApiClient: BlockstackSubdomainRegistrarApiClient;
        beforeEach(() => {
            const options = {
                baseUrl: 'https://registrar.cruxpay.com/',
                headers: {
                    "x-domain-name": "testWallet_crux",
                },
                json: true,
                method: "GET",
                url: `/index`,
            };
            let successResponse = {
                "status": true,
                "domainName": "testWallet_crux.id"
            }
            mockHttpJSONRequest.withArgs(options).resolves(successResponse);
            blockstackSubdomainRegistrarApiClient = new BlockstackSubdomainRegistrarApiClient(baseUrl,blockstackDomainId);
        })
        it('getIndex', async() => {
            // mocks
            const options = {
                baseUrl: baseUrl,
                headers: {
                    "x-domain-name": "testWallet_crux",
                },
                json: true,
                method: "GET",
                url: `/index`,
            };
            let successResponse = {
                "status": true,
                "domainName": "testWallet_crux.id"
            }
            mockHttpJSONRequest.withArgs(options).resolves(successResponse);
            // calling the method
            const name = await blockstackSubdomainRegistrarApiClient.getIndex();

            // run expectations
            expect(name).to.be.eql(successResponse);
        })
        it('getSubdomainStatus', async () => {
            // mocks
            const options = {
                baseUrl: baseUrl,
                headers: {
                    "x-domain-name": 'testWallet_crux',
                },
                json: true,
                method: "GET",
                url: `/status/testUser`,
            }
            let registeredResponse = {
                "status": "Subdomain propagated"
            }
            mockHttpJSONRequest.withArgs(options).resolves(registeredResponse);
            
            // calling the method
            const name = await blockstackSubdomainRegistrarApiClient.getSubdomainStatus(user);

            // run expectations
            expect(name).to.be.eql(registeredResponse)
        })
        it('getSubdomainRegistrarEntriesByAddress', async () => {
            // mocks
            const options = {
                baseUrl: baseUrl,
                headers: {
                    "x-domain-name": 'testWallet_crux',
                },
                json: true,
                method: "GET",
                url: '/subdomain/17vkTRWLLZrKunkpgSro1ADtZd2yw4uig2',
            }
            let registrartionResponse = [
                {
                    "queue_ix": 36,
                    "subdomainName": user,
                    "owner": ownerAdderss,
                    "sequenceNumber": "0",
                    "zonefile": "$ORIGIN testUser\n$TTL 3600\n_https._tcp URI 10 1 https://hub.cruxpay.com",
                    "signature": null,
                    "status": "submitted",
                    "status_more": "fa799fc7129106f6ffc4f5183f8bddde3542ac3569662165f404fe9990caa452",
                    "received_ts": "2019-12-12T09:21:11.000Z"
                }
            ]

            mockHttpJSONRequest.resolves(registrartionResponse);
            //review later
            
            // calling the method
            const name = await blockstackSubdomainRegistrarApiClient.getSubdomainRegistrarEntriesByAddress("17LLpUjHjwH6FzjrhbbwHTNweQN3bCKs7N");

            // run expectations
            expect(name).to.be.eql(registrartionResponse)
        })
        it('registerSubdomain', async () => {
            // mocks
            const options = {
                baseUrl: baseUrl,
                body: {
                    user,
                    owner_address: ownerAdderss,
                    zonefile: `$ORIGIN ${user}\n$TTL 3600\n_https._tcp URI 10 1 https://hub.cruxpay.com`,
                },
                headers: {
                    "Content-Type": "application/json",
                    "x-domain-name": 'testWallet_crux',
                },
                json: true,
                method: "POST",
                strictSSL: false,
                url: "/register",
            };

            mockHttpJSONRequest.withArgs(options).resolves()
            //review later
            
            // calling the method
            const name = await blockstackSubdomainRegistrarApiClient.registerSubdomain(user, "https://hub.cruxpay.com", ownerAdderss);

            // run expectations
            expect(name).to.be.eql(null)
        }) 
    })    
});