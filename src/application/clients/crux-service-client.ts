import { RemoteKeyManager, SecureCruxNetwork } from "../../core/domain-services";
import { CruxId, InMemStorage } from "../../packages/";
import { CruxWalletClient } from "./crux-wallet-client";

export class CruxServiceClient {
    private selfIdClaim: any;
    private secureCruxNetwork: SecureCruxNetwork;

    constructor(selfIdClaim: any, userRepo: any, pubsubClientFactory: any) {
        this.selfIdClaim = selfIdClaim;
        this.secureCruxNetwork = new SecureCruxNetwork(userRepo, pubsubClientFactory, selfIdClaim);
    }

    public async getWalletClientForUser(remoteUserId: CruxId) {
        await this.secureCruxNetwork.initialize();
        const remoteKeyManager = new RemoteKeyManager(this.secureCruxNetwork, remoteUserId);
        await remoteKeyManager.initialize();
        return new CruxWalletClient({
            cacheStorage: new InMemStorage(),
            // @ts-ignore
            privateKey: remoteKeyManager,
            walletClientName: remoteUserId.components.domain,
        });
    }
}
