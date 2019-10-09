import { IntegrationEventer } from "../../shared-kernel/eventer";
import { MESSAGE_TYPE } from "../../shared-kernel/models";

export class CruxUserEventHandler {
    private eventer: any;

    constructor() {
        this.eventer = IntegrationEventer.getInstance();
    }

    public configure(events: MESSAGE_TYPE[], callback: CallableFunction) {
        for (const eventMessage in events) {
            if (eventMessage) {
                this.eventer.on(eventMessage, callback);
            }
        }
    }
}
