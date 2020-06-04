import { CruxProtocolMessenger, RemoteKeyManager} from "../../core/domain-services";
import { keyManagementProtocol } from "../../infrastructure";
import { CruxId, InMemStorage } from "../../packages/";
import { CruxWalletClient } from "./crux-wallet-client";

export class CruxServiceClient {
    private selfIdClaim: any;
    private cruxProtocolMessenger: any;

    constructor(selfIdClaim: any, secureCruxNetwork: any, protocolSchema?: any) {
        this.selfIdClaim = selfIdClaim;
        this.cruxProtocolMessenger = new CruxProtocolMessenger(secureCruxNetwork, protocolSchema ? protocolSchema : keyManagementProtocol);
    }

    public async getWalletClientForUser(remoteUserId: CruxId) {
        await this.cruxProtocolMessenger.initialize();
        const remoteKeyManager = new RemoteKeyManager(this.cruxProtocolMessenger, remoteUserId);

        await remoteKeyManager.initialize();
        return new CruxWalletClient({
            cacheStorage: new InMemStorage(),
            disableCruxMessenger: true,
            // @ts-ignore
            privateKey: remoteKeyManager,
            walletClientName: remoteUserId.components.domain,
        });
    }
}
