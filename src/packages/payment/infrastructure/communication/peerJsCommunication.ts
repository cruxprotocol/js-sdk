import { CommunicationBase } from "../../domain/messageProcessor/communication";
import { IMessage, IUserID } from "../../shared-kernel/interfaces";
import { Message } from "../../shared-kernel/models";


export class PeerJsCommunication extends CommunicationBase {

    private _onMessageCallback: Function | undefined;

    constructor() {
        super();
        this._onMessageCallback = undefined;
    }
    public sendMessage = async (message: any, userID: IUserID): Promise<boolean> => {
        // somehow send the message
        return true;
    }

    public onMessageRecieved = async (): Promise<any> => {
        // this is where your message will first touch the code
        const message: any = "encrypted message string";
        if (this._onMessageCallback){
            this._onMessageCallback(message);
        }
        return message;
    }

    public initialise = async (options: any) => {
        if(options.onMessageRecieved) {
            this._onMessageCallback  = options.onMessageRecieved;
        }
    } 
}