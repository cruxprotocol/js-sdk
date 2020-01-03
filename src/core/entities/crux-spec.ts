import { IClientAssetMapping, IGlobalAsset, IGlobalAssetList } from "../../packages/configuration-service";
import { BaseError } from "../../packages/error";
import { IdTranslator } from "../../packages/identity-utils";
import { IBlockstackServiceInputOptions } from "../../packages/name-service/blockstack-service";
import globalAssetList from "../global-asset-list.json";
const assetIdRegex = new RegExp(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$`);
const urlRegex = new RegExp(`^(?:http(s)?:\\/\\/)?[\\w.-]+(?:\\.[\\w\\.-]+)+[\\w\\-\\._~:/?#[\\]@!\\$&'\\(\\)\\*\\+,;=.]+$`);
export class Validations {
    public static validateRegex = (string: string, regex: RegExp) => {
        if (!regex.test(string)) {
            throw new BaseError(null, `regex failed for: ${string}`);
        }
    }
    public static validateURL = (url: string) => {
        try {
            Validations.validateRegex(url, urlRegex);
        } catch (e) {
            throw new BaseError(e, `Invalid URL: ${url}`);
        }
    }
    public static validateAssetId = (assetId: string) => {
        try {
            Validations.validateRegex(assetId, assetIdRegex);
        } catch (e) {
            throw new BaseError(e, `Invalid AssetID: ${assetId}`);
        }
    }
    public static validateGlobalAsset = (assetObject: IGlobalAsset) => {
        // TODO: add validations for all fields
        Validations.validateAssetId(assetObject.assetId);
        // tslint:disable-next-line: no-unused-expression
        assetObject.parentAssetId && Validations.validateAssetId(assetObject.parentAssetId);
    }
    public static validateAssetList = (assetList: IGlobalAssetList) => {
        assetList.forEach(Validations.validateGlobalAsset);
    }
    public static validateAssetMapping = (assetMapping: IClientAssetMapping) => {
        Object.keys(assetMapping).forEach((assetSymbol) => {Validations.validateAssetId(assetMapping[assetSymbol]); });
    }
    public static validateNameServiceConfig = (nameServiceConfig: IBlockstackServiceInputOptions) => {
        // TODO: domain name validation
        Validations.validateURL(nameServiceConfig.gaiaHub);
        Validations.validateURL(nameServiceConfig.subdomainRegistrar);
        nameServiceConfig.bnsNodes.forEach(Validations.validateURL);
    }
}
export const CruxSpec = {
    blockstack: class blockstack {
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
    validations: Validations,
};
