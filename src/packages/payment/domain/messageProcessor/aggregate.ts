import { IMessage } from "../../shared-kernel/interfaces";
import { MESSAGE_TYPE } from "../../shared-kernel/models";
import { CruxUserEventHandler } from "./events";

class MessageQueue {
    // not accessible from outside, the messages that were sent by this guy for which acknowledgement did not arrived
    // should also keep ignored messages queue which tells what messages were ignored ??
}

export class MessageProcessor {

    private eventer: CruxUserEventHandler;

    constructor(configuration: any) {
        let eventsToListen = [MESSAGE_TYPE.REQUEST_PAYMENT];
        if (configuration.events) {
            eventsToListen = configuration.events;
        }
        this.eventer = new CruxUserEventHandler();
        this.eventer.configure(eventsToListen, this.sendMessage);
    }

    public sendMessage = async (message: IMessage): Promise<boolean> => {
        
    }

    public onAcknowledgementRecieved() {
        
    }
}
