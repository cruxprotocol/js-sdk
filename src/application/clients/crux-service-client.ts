import { RemoteKeyManager, SecureCruxIdMessenger } from "../../core/domain-services";
import { CruxId, InMemStorage } from "../../packages/";
import { CruxWalletClient } from "./crux-wallet-client";

export class CruxServiceClient {

    public getWalletClientForUser(secureCruxIdMessenger: SecureCruxIdMessenger, remoteUserId: CruxId) {
        return new CruxWalletClient({
            cacheStorage: new InMemStorage(),
            privateKey: new RemoteKeyManager(secureCruxIdMessenger, remoteUserId),
            walletClientName: remoteUserId.components.domain,
        });
    }
}
