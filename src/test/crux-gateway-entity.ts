import {CruxGateway} from "../core/entities";
import {InMemoryCruxGatewayRepository} from "./crux-gateway-utils";
import {getIdClaimForUser, getValidCruxUser, getValidCruxUser2, patchMissingDependencies} from "./test-utils";
patchMissingDependencies()
describe('CRUX Gateway Entity Tests', async function() {

    beforeEach(function() {
        this.timeout(1000)
        this.inmemoryGatewayRepo = new InMemoryCruxGatewayRepository();

        this.user1 = getValidCruxUser();
        this.user2 = getValidCruxUser2();

        this.user1IDClaim = getIdClaimForUser(this.user1);
        this.user2IDClaim = getIdClaimForUser(this.user2)

    });
    it('New private address addition for self and resolution works properly', async function() {
        this.user1Gateway = this.inmemoryGatewayRepo.openGateway('BASIC', this.user1IDClaim);
        this.user2Gateway = this.inmemoryGatewayRepo.openGateway('BASIC', this.user2IDClaim);

        this.user2Gateway.listen((md: any, msg: any)=>{
            console.log("User 2 Received Message ", md, msg);
        });
        this.user1Gateway.sendMessage(this.user2.cruxID, "YOLO");
    });
});
