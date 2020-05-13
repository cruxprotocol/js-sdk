import {createNanoEvents, DefaultEvents, Emitter} from "nanoevents";
import {CruxProtocolMessenger, SecureCruxIdMessenger} from "../../core/domain-services";
import {IKeyManager, IProtocolMessage} from "../../core/interfaces";
import {CruxId} from "../../packages";
import {remoteMethodInvocationProtocol} from "./crux-messenger";

// export const getGatewayKeyManager = () => {
//     const gcm = new GatewayKeyManager(CruxId.fromString("binance@merchant.crux"), CruxId.fromString("keymanager@cruxpay.crux"), messenger);
// }

function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        // tslint:disable-next-line:no-bitwise prefer-const
        let r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export class GatewayKeyManager implements IKeyManager {
    private static getInternalEventName(invocationId: string) {
        return "RETURN_" + invocationId;
    }
    private selfId: CruxId;
    private proxyCruxId: CruxId;
    private rmiMessenger: CruxProtocolMessenger;
    private eventBus: Emitter<DefaultEvents>;
    constructor(selfId: CruxId, proxyCruxId: CruxId, messenger: SecureCruxIdMessenger) {
        this.rmiMessenger = new CruxProtocolMessenger(messenger, remoteMethodInvocationProtocol);
        this.selfId = selfId;
        this.proxyCruxId = proxyCruxId;
        this.eventBus = createNanoEvents();
        this.rmiMessenger.listen((message: IProtocolMessage) => {
            if (message.type === "RETURN") {
                this.eventBus.emit(GatewayKeyManager.getInternalEventName(message.content.invocationId), message);
            } else {
                console.log("Did not recognize this message type");
            }
        });
    }
    public deriveSharedSecret = async (publicKey: string): Promise<string> => {
        return this.newInvocation({
            args: [publicKey],
            invocationId: "uuid",
            method: "deriveSharedSecret",
        });
    }
    public getPubKey = async (): Promise<string> => {
        return this.newInvocation({
            args: [],
            invocationId: "uuid",
            method: "deriveSharedSecret",
        });
    }
    public signWebToken = async (payload: any): Promise<string> => {
        return this.newInvocation({
            args: [payload],
            invocationId: "uuid",
            method: "deriveSharedSecret",
        });
    }
    private newInvocation = (messageContent: any): Promise<any> => {
        return new Promise(async (reject, resolve) => {
            const invocationId = uuidv4();
            await this.rmiMessenger.send({
                content: messageContent,
                type: "INVOKE",
            }, this.proxyCruxId);

            const unbind = this.eventBus.on(GatewayKeyManager.getInternalEventName(invocationId), (message: IProtocolMessage) => {
                unbind();
                resolve(message.content.result);
            });
        });
    }
}
