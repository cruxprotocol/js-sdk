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
        return topicEmitter
    }
}

export class InMemoryMaliciousPubSubClient implements IPubSubClient {
    private emitterByTopic: any;
    private topic;
    constructor(cruxID){
        this.emitterByTopic = {};
        this.topic = "topic_" + cruxID.toString();
    }
    public publish(topic: string, data: any): void {
        let topicEmitter = this.getEmitter(this.topic);
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
    public getRecipientClient =  (selfCruxId: CruxId, recipientCruxId: CruxId): IPubSubClient => {
        return this.pubsubClient
    };
    public getSelfClient = (idClaim: ICruxIdClaim): IPubSubClient => {
        return this.pubsubClient
    }

}

export class InMemoryMaliciousPubSubClientFactory implements IPubSubClientFactory {
    // private pubsubClient: InMemoryPubSubClient;
    private maliciousPubsubClient: InMemoryMaliciousPubSubClient;
    constructor(cruxID) {
        this.maliciousPubsubClient = new InMemoryMaliciousPubSubClient(cruxID);
        // this.pubsubClient = new InMemoryPubSubClient()
    }
    public getRecipientClient =  (selfCruxId: CruxId, recipientCruxId: CruxId): IPubSubClient => {
        return this.maliciousPubsubClient
    };
    public getSelfClient = (idClaim: ICruxIdClaim): IPubSubClient => {
        return this.maliciousPubsubClient
    }

}
