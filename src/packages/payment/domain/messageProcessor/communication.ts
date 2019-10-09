import { IMessage, IUserID } from "../../shared-kernel/interfaces";
import { Message } from "../../shared-kernel/models";

export abstract class Encryption {
    public abstract encryptMessage = async (message: IMessage): Promise<string> => "";
    public abstract decryptMessage = async (encryptedMessage: string): Promise<IMessage> ;

}

export abstract class CommunicationBase {
    public abstract sendMessage = async (message: IMessage, userID: IUserID): Promise<boolean> => true;
    public abstract onMessageRecieved = async (): Promise<IMessage> ;
}
