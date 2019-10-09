import { Encryption } from "../../domain/messageProcessor/communication";
import { IMessage } from "../../shared-kernel/interfaces";

export class ECDSAEncryption extends Encryption {
    public encryptMessage = (message: IMessage): Promise<string> => {
        return new Promise(async(resolve, reject) => {
            resolve("");
        });
    }

    public decryptMessage = (encryptedMessage: string): Promise<IMessage> => {
        return new Promise(async(resolve, reject) => {
            let message: IMessage
            resolve(message);
        });
    }
}
