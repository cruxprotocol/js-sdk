import { Decoder, object, optional, string as stringValidator } from "@mojotech/json-type-validation";
import config from "../../config";
import { IClientAssetMapping, IGlobalAsset, IGlobalAssetList } from "../../packages/configuration-service";
import { BaseError, ErrorHelper, PackageErrorCode } from "../../packages/error";
import { BlockstackId, IdTranslator } from "../../packages/identity-utils";
import { IBlockstackServiceInputOptions } from "../../packages/name-service/blockstack-service";
import { IAddress, IAddressMapping } from "../entities/crux-user";
import globalAssetList from "../global-asset-list.json";
import { ICruxBlockstackInfrastructure } from "../interfaces";
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
        if (!CruxSpec.globalAssetList.map((asset) => asset.assetId).includes(assetId)) {
            throw new BaseError(null, `AssetID: ${assetId} is not recognized.`);
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
        if (nameServiceConfig.gaiaHub) {
            Validations.validateURL(nameServiceConfig.gaiaHub);
        }
        if (nameServiceConfig.subdomainRegistrar) {
            Validations.validateURL(nameServiceConfig.subdomainRegistrar);
        }
        if (nameServiceConfig.bnsNodes) {
            nameServiceConfig.bnsNodes.forEach(Validations.validateURL);
        }
    }
    public static validateAddressObj = (addressObject: IAddress) => {
        const addressDecoder: Decoder<IAddress> = object({
            addressHash: stringValidator(),
            secIdentifier: optional(stringValidator()),
        });
        try {
            addressDecoder.runWithException(addressObject);
        } catch (e) {
            throw ErrorHelper.getPackageError(e, PackageErrorCode.AddressMappingDecodingFailure);
        }
    }
    public static validateAssetIdAddressMap = (addressMap: IAddressMapping) => {
        for (const assetId in addressMap) {
            if (addressMap.hasOwnProperty(assetId)) {
                Validations.validateAssetId(assetId);
                Validations.validateAddressObj(addressMap[assetId]);
            }
          }
    }
}
export const CruxSpec = {
    blockstack: class blockstack {
        public static infrastructure: ICruxBlockstackInfrastructure = {
            bnsNodes: config.BLOCKSTACK.BNS_NODES,
            gaiaHub: config.BLOCKSTACK.GAIA_HUB,
            subdomainRegistrar: config.BLOCKSTACK.SUBDOMAIN_REGISTRAR,
        };
        public static configSubdomain: string = "_config";
        public static getDomainConfigFileName = (domain: string): string => {
            return `${domain}_client-config.json`;
        }
        public static getConfigBlockstackName = (domain: string): string => {
            return `${CruxSpec.blockstack.configSubdomain}.${domain}_crux.id`;
        }
        public static getCruxPayFilename = (blockstackId: BlockstackId): string => {
            const cruxDomainString: string = IdTranslator.blockstackToCrux(blockstackId).components.domain;
            return `${cruxDomainString}_cruxpay.json`;
        }
    },
    globalAssetList,
    idTranslator: IdTranslator,
    validations: Validations,
};
