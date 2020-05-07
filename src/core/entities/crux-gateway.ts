import {EventBusEventNames, GatewayEventBus, GatewayPacketManager} from "../domain-services";
import {ICruxIdPubSubChannel, IGatewayPacket, IGatewayProtocolHandler} from "../interfaces";

export interface ICruxGatewayParams {
    protocolHandler: IGatewayProtocolHandler;
    selfChannel?: ICruxIdPubSubChannel;
    recipientChannel?: ICruxIdPubSubChannel;
}
export class CruxGateway {

    private messageListener: (message: any) => void;
    private packetManager: GatewayPacketManager;
    private selfChannel: ICruxIdPubSubChannel | undefined;
    private recepientChannel: ICruxIdPubSubChannel | undefined;

    constructor(params: ICruxGatewayParams) {
        // const that = this;
        if ((!params.selfChannel && !params.recipientChannel) || (params.selfChannel && params.recipientChannel)) {
            throw Error("Only one of selfChannel or recipientChannel must be present");
        }
        if (params.selfChannel && !params.selfChannel.keyManager) {
            throw Error("selfChannel must have keyManager");
        }
        this.selfChannel = params.selfChannel;
        this.recepientChannel = params.recipientChannel;
        this.messageListener = (message) => undefined;
        this.packetManager = new GatewayPacketManager(params.protocolHandler, params.selfChannel ? {
            cruxId: params.selfChannel.cruxId,
            keyManager: params.selfChannel.keyManager!,
        } : undefined);
    }

    public sendMessage(message: any) {
        if (!this.recepientChannel) {
            throw Error("Cannot send in gateway with no recipientChannel");
        }
        const eventBus = new GatewayEventBus(this.recepientChannel.pubsubClient, this.recepientChannel.cruxId, this.selfChannel ? this.selfChannel.cruxId : undefined);
        const packet: IGatewayPacket = this.packetManager.createNewPacket(message);
        const serializedPacket = JSON.stringify(packet);
        eventBus.send(serializedPacket);
    }

    public listen(messageListener: (message: any, metadata: any) => void) {
        if (!this.selfChannel) {
            throw Error("Cannot listen to a gateway with no selfChannel");
        }
        const eventBus = new GatewayEventBus(this.selfChannel.pubsubClient, undefined, this.selfChannel.cruxId);
        eventBus.on(EventBusEventNames.newMessage, (data: string) => {
            const deserializedData = JSON.parse(data);
            const packet: IGatewayPacket = this.packetManager.parse(deserializedData);
            messageListener(packet.message, packet.metadata);
        });
    }
}
