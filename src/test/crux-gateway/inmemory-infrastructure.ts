import {createNanoEvents} from "nanoevents";
import {CruxGateway} from "../../core/entities";
import {
    ICruxGatewayRepository, ICruxIdPubSubChannel,
    IGatewayIdentityClaim,
    IGatewayProtocolHandler, IGatewayRepositoryGetParams,
    IPubSubClient
} from "../../core/interfaces";
import {
    CruxGatewayPaymentsProtocolHandler,
    getProtocolHandler
} from "../../infrastructure/implementations";

export class BasicGatewayProtocolHandler implements IGatewayProtocolHandler {
    public getName(): string {
        return "BASIC";
    }

    public validateMessage(gatewayMessage: any): boolean {
        return true;
    }
}

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

export class InMemoryCruxGatewayRepository implements ICruxGatewayRepository {
    private commonPubsubClient: InMemoryPubSubClient;
    private supportedProtocols: any;
    constructor(){
        this.commonPubsubClient = new InMemoryPubSubClient();
        this.supportedProtocols = [ BasicGatewayProtocolHandler, CruxGatewayPaymentsProtocolHandler ];
    }
    public get(params: IGatewayRepositoryGetParams): CruxGateway {
        let receiverPubSubChannel: ICruxIdPubSubChannel | undefined;
        if (params.receiverId) {
            receiverPubSubChannel = {
                cruxId: params.receiverId,
                pubsubClient: this.commonPubsubClient,
            };
        }
        return new CruxGateway({
            protocolHandler: getProtocolHandler(this.supportedProtocols, params.protocol? params.protocol : "BASIC"),
            recipientChannel: receiverPubSubChannel,
            selfChannel: this.getChannel(params.selfIdClaim)});
    }
    private getChannel(selfIdClaim?: IGatewayIdentityClaim): ICruxIdPubSubChannel | undefined {
        if (selfIdClaim) {
            return  {
                ...selfIdClaim,
                pubsubClient: this.commonPubsubClient,
            };
        }
    }
}
