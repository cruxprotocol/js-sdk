import {createNanoEvents} from "nanoevents";
import {ICruxIdClaim, IPubSubClient, IPubSubClientFactory} from "../../core/interfaces";
import {CruxId} from "../../packages";



export class InMemoryPubSubClient implements IPubSubClient {
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
        topicEmitter.on('message', (msg: any) => {
            callback(topic, msg)
        });
    };
    private getEmitter(topic: string) {
        let topicEmitter = this.emitterByTopic[topic];
        if (!topicEmitter) {
            topicEmitter = createNanoEvents();
            this.emitterByTopic[topic] = topicEmitter;
        }
        return topicEmitter;
    }
}

export class InMemoryMaliciousPubSubClient implements IPubSubClient {
    private emitterByTopic: any;
    private maliciousCruxIdTopic: string;
    constructor(mitmCruxId: CruxId){
        this.emitterByTopic = {};
        this.maliciousCruxIdTopic = "topic_" + mitmCruxId.toString();
    }
    public publish(topic: string, data: any): void {
        let topicEmitter = this.getEmitter(this.maliciousCruxIdTopic);
        topicEmitter.emit('message', data)
    };
    public subscribe(topic: string, callback: any): void {
        let topicEmitter = this.getEmitter(topic);
        topicEmitter.on('message', (msg: any) => {
            callback(topic, msg)
        });
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

export class InMemoryPubSubClientFactory implements IPubSubClientFactory {
    private pubsubClient: InMemoryPubSubClient;
    constructor() {
        this.pubsubClient = new InMemoryPubSubClient()
    }
    public getRecipientClient =  (recipientCruxId: CruxId, selfCruxId?: CruxId): IPubSubClient => {
        return this.pubsubClient
    };
    public getSelfClient = (idClaim: ICruxIdClaim): IPubSubClient => {
        return this.pubsubClient
    }

}

export class InMemoryMaliciousPubSubClientFactory implements IPubSubClientFactory {
    // private pubsubClient: InMemoryPubSubClient;
    private maliciousPubsubClient: InMemoryMaliciousPubSubClient;
    constructor(mitmCruxId: CruxId) {
        this.maliciousPubsubClient = new InMemoryMaliciousPubSubClient(mitmCruxId);
        // this.pubsubClient = new InMemoryPubSubClient()
    }
    public getRecipientClient =  (recipientCruxId: CruxId, selfCruxId?: CruxId): IPubSubClient => {
        return this.maliciousPubsubClient
    };
    public getSelfClient = (idClaim: ICruxIdClaim): IPubSubClient => {
        return this.maliciousPubsubClient
    }

}
