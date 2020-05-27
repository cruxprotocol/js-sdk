import { CruxId } from "src/packages";
import { RemoteKeyManager, SecureCruxIdMessenger } from "../../core/domain-services";
import { CruxWalletClient } from "./crux-wallet-client";

export class CruxServiceClient {

    public getWalletClientForUser(secureCruxIdMessenger: SecureCruxIdMessenger, remoteUserId: CruxId) {
        console.log("Hd");
        return new CruxWalletClient({
            privateKey: new RemoteKeyManager(secureCruxIdMessenger, remoteUserId),
            walletClientName: remoteUserId.components.domain,
        });
    }
}
