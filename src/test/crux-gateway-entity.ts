import {CruxGateway} from "../core/entities";
import {InMemoryCruxGatewayRepository} from "./crux-gateway-utils";
import {getIdClaimForUser, getValidCruxUser, getValidCruxUser2, patchMissingDependencies} from "./test-utils";
patchMissingDependencies()
describe('CRUX Gateway Entity Tests', async function() {

    beforeEach(function() {
        this.timeout(1000)
        this.inmemoryGatewayRepo = new InMemoryCruxGatewayRepository();

        const user1 = getValidCruxUser();
        const user2 = getValidCruxUser2();

        this.user1IDClaim = getIdClaimForUser(user1);
        this.user2IDClaim = getIdClaimForUser(user2)
    });
    it('New private address addition for self and resolution works properly', async function() {
        const user1Gateway: CruxGateway = this.inmemoryGatewayRepo.openGateway('BASIC', this.user1IDClaim);
        const user2Gateway: CruxGateway = this.inmemoryGatewayRepo.openGateway('BASIC', this.user2IDClaim);
        user2Gateway.listen((md, msg)=>{
            console.log("User 2 Received Message ", md, msg);
        });
        user1Gateway.sendMessage(this.user2IDClaim.cruxId, "YOLO");
    });
});
