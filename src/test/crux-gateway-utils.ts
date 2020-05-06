import {createNanoEvents} from "nanoevents";
import {CruxGateway} from "../core/entities";
import {ICruxGatewayRepository, IGatewayIdentityClaim, IPubSubProvider} from "../core/interfaces";
import {getProtocolHandler} from "../infrastructure/implementations";

class InMemoryPubSubProvider implements IPubSubProvider {
    private emitterByTopic: any;
    constructor(){
        this.emitterByTopic = {}
    }
    public publish(topic: string, data: any): void {
        let topicEmitter = this.getEmitter(topic);
        topicEmitter.emit('message', data)
    };
    public subscribe(topic: string, callback: any): void {
        let topicEmitter = this.getEmitter(topic);
        topicEmitter.on('message', callback)
    };
    private getEmitter(topic: string) {
        let topicEmitter = this.emitterByTopic[topic];
        if (!topicEmitter) {
            topicEmitter = createNanoEvents();
            this.emitterByTopic[topic] = topicEmitter;
        }
        return topicEmitter
    }
}

class InMemoryCruxGatewayRepository implements ICruxGatewayRepository {
    public openGateway(protocol: string, selfClaim?: IGatewayIdentityClaim): CruxGateway {
        const protocolHandler = getProtocolHandler(protocol);
        if (!protocolHandler) {
            throw Error("Unsupported protocol");
        }
        return new CruxGateway(new InMemoryPubSubProvider(), protocolHandler, selfClaim);
    }

}
