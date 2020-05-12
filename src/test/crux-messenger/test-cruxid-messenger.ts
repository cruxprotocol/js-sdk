import {InMemoryPubSubClientFactory} from "./inmemory-implementations";

describe('Testing CruxID Messenger', function() {
    beforeEach(async function() {
        this.pubsubClientFactory = new InMemoryPubSubClientFactory();
    });
})
