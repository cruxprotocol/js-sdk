import { IMessage } from "../../shared-kernel/interfaces";

class MessageQueue {
    // not accessible from outside, the messages that were sent by this guy for which acknowledgement did not arrived
    // should also keep ignored messages queue which tells what messages were ignored ??
}

export class MessageProcessor {
    public sendMessage = async (message: IMessage): Promise<boolean> => {
        const message = 
    }
}