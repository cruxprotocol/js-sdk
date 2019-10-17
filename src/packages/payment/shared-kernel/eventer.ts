import { EventEmitter } from "eventemitter3";

export class IntegrationEventer extends EventEmitter {

    public static getInstance(): IntegrationEventer {
        if (!IntegrationEventer.instance) {
            IntegrationEventer.instance = new IntegrationEventer();
        }
        return IntegrationEventer.instance;
    }

    private static instance: IntegrationEventer;

    private constructor() { super(); }

    public emitMessage(messageType: string, messageData: any) {
        console.log(`emitting event ${messageType} with data ${messageData}`);
        this.emit(messageType, messageData);
    }
}
