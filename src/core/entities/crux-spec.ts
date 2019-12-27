import { config } from "../../index";
import globalAssetList from "../global-asset-list.json";
export const CruxSpec = {
    blockstack: class blockstack {
        public static gaiaWriteURL: string = config.BLOCKSTACK.GAIA_HUB;
        public static bnsNodes: string[] = config.BLOCKSTACK.BNS_NODES;
        public static getDomainBlockstackID = (domain: string): string => {
            return `${domain}_crux.id`;
        }
        public static getDomainConfigFileName = (domain: string): string => {
            return `${domain}_client-config.json`;
        }
        public static getConfigBlockstackID = (domain: string): string => {
            return `_config.${domain}_crux.id`;
        }
    },
    globalAssetList,
};
