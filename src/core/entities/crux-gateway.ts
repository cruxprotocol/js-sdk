import {CruxId} from "../../packages";
import {EventBusEventNames, GatewayEventBus, GatewayPacketManager} from "../domain-services";
import {IGatewayIdentityClaim, IGatewayProtocolHandler, IPubSubProvider} from "../interfaces";

export class CruxGateway {

    private pubsubProvider: IPubSubProvider;
    private messageListener: (message: any) => void;
    private selfClaim?: IGatewayIdentityClaim;
    private packetManager: GatewayPacketManager;

    constructor(pubsubProvider: IPubSubProvider, protocolHandler: IGatewayProtocolHandler, selfClaim?: IGatewayIdentityClaim) {
        // const that = this;
        this.selfClaim = selfClaim;
        this.pubsubProvider = pubsubProvider;
        this.messageListener = (message) => undefined;
        this.packetManager = new GatewayPacketManager(protocolHandler, selfClaim);
    }

    public sendMessage(recipient: CruxId, message: any) {
        const eventBus = new GatewayEventBus(this.pubsubProvider, recipient, this.selfClaim!.cruxId);
        const packet = this.packetManager.createNewPacket(message);
        const serializedPacket = JSON.stringify(packet);
        eventBus.send(serializedPacket);
    }

    public listen(messageListener: (message: any, metadata: any) => void) {
        if (!this.selfClaim) {
            throw Error("Cannot listen to a gateway with no selfClaim");
        }
        const eventBus = new GatewayEventBus(this.pubsubProvider, undefined, this.selfClaim!.cruxId);
        eventBus.on(EventBusEventNames.newMessage, (data: string) => {
            const deserializedData = JSON.parse(data);
            const packet = this.packetManager.parse(deserializedData);
            messageListener(packet.message, packet.metadata);
        });
    }
}
