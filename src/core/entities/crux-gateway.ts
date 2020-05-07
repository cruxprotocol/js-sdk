import {EventBusEventNames, GatewayEventBus, GatewayPacketManager} from "../domain-services";
import {ICruxIdPubSubChannel, IGatewayPacket, IGatewayProtocolHandler} from "../interfaces";

export class CruxGateway {

    private messageListener: (message: any) => void;
    private packetManager: GatewayPacketManager;
    private selfChannel: ICruxIdPubSubChannel | undefined;
    private recepientChannel: ICruxIdPubSubChannel | undefined;

    constructor(protocolHandler: IGatewayProtocolHandler, selfChannel?: ICruxIdPubSubChannel, recipientChannel?: ICruxIdPubSubChannel) {
        // const that = this;
        if (!selfChannel && !recipientChannel) {
            throw Error("At least one of selfChannel or recipientChannel must be present");
        }
        if (selfChannel && !selfChannel.keyManager) {
            throw Error("selfChannel must have keyManager");
        }
        this.selfChannel = selfChannel;
        this.recepientChannel = recipientChannel;
        this.messageListener = (message) => undefined;
        this.packetManager = new GatewayPacketManager(protocolHandler, selfChannel ? {
            cruxId: selfChannel.cruxId,
            keyManager: selfChannel.keyManager!,
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
