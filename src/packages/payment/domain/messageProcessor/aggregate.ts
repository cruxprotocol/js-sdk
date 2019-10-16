import { IMessage } from "../../shared-kernel/interfaces";
import { MESSAGE_TYPE } from "../../shared-kernel/models";
import { CruxUserEventHandler } from "./events";
import { CommunicationBase, Encryption } from "./communication";

class MessageQueue {
    // not accessible from outside, the messages that were sent by this guy for which acknowledgement did not arrived
    // should also keep ignored messages queue which tells what messages were ignored ??
}

export class MessageProcessor {

    private eventer: CruxUserEventHandler;
    private communication: CommunicationBase;
    private encryption: Encryption | undefined;

    constructor(configuration: any) {
        let eventsToListen = [MESSAGE_TYPE.REQUEST_PAYMENT];
        if (configuration.events) {
            eventsToListen = configuration.events;
        }
        this.eventer = new CruxUserEventHandler();
        this.eventer.configure(eventsToListen, this.sendMessage);
        this.communication = configuration.communication;
        this.encryption = configuration.Encryption || undefined;

        this.communication.initialise({onMessageRecieved: this.onAcknowledgementRecieved});
    }

    public sendMessage = async (message: IMessage): Promise<boolean> => {
        // encrypt the message here
        const encryptedMessage: string = JSON.stringify(message);
        const sendStatus = await this.communication.sendMessage(encryptedMessage, message.to);   
        return sendStatus;
    }

    public onMessageRecieved = async(message: string) => {
        this.eventer.getIntegerationEventer().emit(message);
    }
}
