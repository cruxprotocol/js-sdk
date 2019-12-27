import globalAssetList from "../global-asset-list.json";
export const CruxSpec = {
    blockstack: class blockstack {
        public static gaiaWriteURL: string = "https://hub.cruxpay.com";
        public static bnsNodes: string[] = ["https://bns.cruxpay.com"];
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
