import { CommunicationBase } from "../../domain/messageProcessor/communication";
import { async, resolve, reject } from "q";
import { IMessage, IUserID } from "../../shared-kernel/interfaces";
import { Message } from "../../shared-kernel/models";


export class PeerJsCommunication extends CommunicationBase {
    public sendMessage = async (message: IMessage, userID: IUserID): Promise<boolean> => {
        return new Promise(async(resolve, reject) => {
            resolve(true);
        });
    }

    public onMessageRecieved = async (): Promise<IMessage> => {
        return new Promise(async(resolve, reject) => {
            let message: IMessage
            resolve(messaage);
        });
    }
}