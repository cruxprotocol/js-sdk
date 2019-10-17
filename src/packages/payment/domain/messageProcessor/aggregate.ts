// import { CommunicationBase } from "./communication";
import { PeerJsCommunication } from "../../infrastructure/communication/peerJsCommunication";
import { IntegrationEventer } from "../../shared-kernel/eventer";

export class MessageProcessor {

    private communication: PeerJsCommunication;
    private eventer: IntegrationEventer;

    constructor(configuration: any) {
        let eventsToListen = ["request_payment"];
        if (configuration.events) {
            eventsToListen = configuration.events;
        }

        // this.communication = configuration.communication;
        this.communication = new PeerJsCommunication();

        this.eventer = IntegrationEventer.getInstance();
        for (const eventName in eventsToListen) {
            if (eventsToListen[eventName]) {
                this.eventer.on(eventsToListen[eventName], this.sendMessage);
            }
        }
    }

    public async initialise() {
        this.communication.initialise({onMessageRecieved: this.onMessageRecieved});
    }

    public sendMessage = async (message: any): Promise<boolean> => {
        // encrypt the message here
        const sendStatus = this.communication.sendMessage(message, message.to);
        return sendStatus;
    }

    public onMessageRecieved = async (message: string) => {
        let decMessage;
        if (typeof message === "string") {
            decMessage = message;
        } else {
            decMessage = JSON.parse(message);
            if (decMessage.type === "request_payment") {
                decMessage.type = "request_payment_recieved";
                this.eventer.emitMessage("request_payment_recieved", decMessage);
            }
        }
    }
}
