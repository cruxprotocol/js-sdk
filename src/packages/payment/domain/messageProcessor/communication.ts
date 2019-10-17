import { IMessage, IUserID } from "../../shared-kernel/interfaces";

export abstract class Encryption {
    public abstract encryptMessage = async (message: IMessage): Promise<string> => "";
    public abstract decryptMessage = async (encryptedMessage: string): Promise<IMessage> ;

}

export abstract class CommunicationBase {
    public abstract initialise(callback: (data: any) => void): void;
    public abstract sendMessage = async (message: any, userID: IUserID): Promise<boolean> => true;
    public abstract onMessageRecieved = async (): Promise<any> ;
}
