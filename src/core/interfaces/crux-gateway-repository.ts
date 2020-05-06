import {CruxId} from "../../packages";
import {CruxGateway, IGatewayMessageSender} from "../entities";
import { IKeyManager } from "./key-manager";

export interface ICruxGatewayRepositoryRepositoryOptions {
    messageProtocol: string; // PAYMENTS
}

export interface ICruxGatewayRepository {
    get: (recipient: CruxId, sender?: IGatewayMessageSender) => CruxGateway;
}
