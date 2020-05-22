import {createNanoEvents} from "nanoevents";
import {ICruxIdClaim, IKeyManager, IPubSubClient, IPubSubClientFactory} from "../../core/interfaces";
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
    public onError = (callback: any) => undefined;
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
    public onError = (callback: any) => undefined;
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
    constructor(mitmId?: CruxId) {
        this.pubsubClient = new InMemoryPubSubClient()
    }
    public getClient =  (from: CruxId, keyManager: IKeyManager, to?: CruxId): IPubSubClient => {
        return this.pubsubClient
    };
}

export class InMemoryMaliciousPubSubClientFactory implements IPubSubClientFactory {
    private maliciousPubsubClient: InMemoryMaliciousPubSubClient;
    constructor(mitmCruxId: CruxId) {
        this.maliciousPubsubClient = new InMemoryMaliciousPubSubClient(mitmCruxId);
    }
    public getClient =  (from: CruxId, keyManager: IKeyManager, to?: CruxId): IPubSubClient => {
        return this.maliciousPubsubClient
    };
}
