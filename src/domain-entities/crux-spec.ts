import { CruxId } from "src/packages/identity-utils";

export const CruxSpec = {
    blockstack: class blockstack {
        public static gaiaWriteURL: string = "https://hub.cruxpay.com";
        public static cruxPayRegistrar: string = "https://registrar.cruxpay.com";
        public static bnsNodes: string[] = ["https://bns.cruxpay.com"];

        public static getDomainConfigFileName = (domain: string) => {
            return `${domain}_client-config.json`;
        }

        public static getConfigID = (domain: string) => {
            return `_config.${domain}_crux.id`;
        }
    },
};
