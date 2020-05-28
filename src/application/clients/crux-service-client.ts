import { RemoteKeyManager, SecureCruxIdMessenger } from "../../core/domain-services";
import { CruxId, InMemStorage } from "../../packages/";
import { CruxWalletClient } from "./crux-wallet-client";

export class CruxServiceClient {
    private selfIdClaim: any;
    private secureCruxIdMessenger: SecureCruxIdMessenger;

    constructor(selfIdClaim: any, userRepo: any, pubsubClientFactory: any) {
        this.selfIdClaim = selfIdClaim;
        this.secureCruxIdMessenger = new SecureCruxIdMessenger(userRepo, pubsubClientFactory, selfIdClaim);
    }

    public getWalletClientForUser(remoteUserId: CruxId) {
        return new CruxWalletClient({
            cacheStorage: new InMemStorage(),
            privateKey: new RemoteKeyManager(this.secureCruxIdMessenger, remoteUserId),
            walletClientName: remoteUserId.components.domain,
        });
    }
}
