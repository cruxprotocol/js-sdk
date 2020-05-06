import {StrongPubSubTransport} from "../infrastructure/implementations";
const localServerConfig = {
    host: 'localhost',
    port: 4005
}
describe('CRUX Gateway Implementations Test', () => {
    describe('StrongPubSubTransport Tests', () => {
        it('Transport without selfId', ()=>{
            const transport = new StrongPubSubTransport(localServerConfig)
            const eventbus = transport.getEventBus()
            return eventBus
        })
    })
})
