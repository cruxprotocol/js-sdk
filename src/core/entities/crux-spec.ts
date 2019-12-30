import { config } from "../../index";
import { IBlockstackInfrastructure } from "../../infrastructure/services/blockstack-service";
import { IdTranslator } from "../../packages/identity-utils";
import globalAssetList from "../global-asset-list.json";
export const CruxSpec = {
    blockstack: class blockstack {
        public static infrastructure: IBlockstackInfrastructure = {
            bnsNodes: config.BLOCKSTACK.BNS_NODES,
            gaiaHub: config.BLOCKSTACK.GAIA_HUB,
        };
        public static configSubdomain: string = "_config";
        public static getDomainConfigFileName = (domain: string): string => {
            return `${domain}_client-config.json`;
        }
        public static getConfigBlockstackID = (domain: string): string => {
            return `${CruxSpec.blockstack.configSubdomain}.${domain}_crux.id`;
        }
    },
    globalAssetList,
    idTranslator: IdTranslator,
};
