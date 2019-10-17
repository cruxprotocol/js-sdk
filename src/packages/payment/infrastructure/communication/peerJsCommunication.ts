// import { CommunicationBase } from "../../domain/messageProcessor/communication";
import io from "socket.io-client";
import { IUserID } from "../../shared-kernel/interfaces";

// export class PeerJsCommunication extends CommunicationBase {
export class PeerJsCommunication {

    private _onMessageCallback: any;
    private _socket: SocketIOClient.Socket | undefined;

    constructor() {
        this._onMessageCallback = undefined;
    }

    public sendMessage = (message: any, userID: IUserID): boolean => {
        if (this._socket && this._socket.connected) {
            this._socket.emit("pc1", message);
            return true;
        } else {
            console.log(`sendMessage failed because socket not connected`);
        }
        return false;
    }

    public onMessageRecieved = (data: any): any => {
        // this is where your message will first touch the code
        if (this._onMessageCallback) {
            this._onMessageCallback(data);
        }
        return data;
    }

    public initialise = async (options: any) => {
        this._socket = io.connect("http://localhost:8080", {autoConnect: true, reconnection: true, reconnectionAttempts: 5, reconnectionDelay: 200});
        this._socket.on("pc1", (data: any) => {
            this.onMessageRecieved(data);
        });
        this._socket.on("connect", (cSocket: any) => {
            console.log("Connected to server for recieving!!!!");
        });

        if (options.onMessageRecieved) {
            this._onMessageCallback  = options.onMessageRecieved;
        }
    }
}
