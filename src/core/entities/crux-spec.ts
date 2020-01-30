import { Decoder, object, optional, string as stringValidator } from "@mojotech/json-type-validation";
import { IClientAssetMapping, IGlobalAsset, IGlobalAssetList } from "../../application/services/crux-asset-translator";
import config from "../../config";
import { BaseError, ErrorHelper, PackageErrorCode } from "../../packages/error";
import { CruxDomainId, CruxId, IdTranslator } from "../../packages/identity-utils";
import { IAddress, IAddressMapping } from "../entities/crux-user";
import globalAssetList from "../global-asset-list.json";
import { ICruxBlockstackInfrastructure } from "../interfaces";
import { INameServiceConfigurationOverrides } from "./crux-domain";
const assetIdRegex = new RegExp(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$`);
// tslint:disable-next-line: tsr-detect-unsafe-regexp
const urlRegex = new RegExp(`^(?:http(s)?:\\/\\/)?[\\w.-]+(?:\\.[\\w\\.-]+)+[\\w\\-\\._~:/?#[\\]@!\\$&'\\(\\)\\*\\+,;=.]+$`);
const parentAssetFallbackKeyRegex = new RegExp(`^(.+)_[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$`)
export class Validations {
    public static validateSubdomainString = (subDomainString: string) => {
        const subdomainRegex: string = "^[a-z]([a-z]|[0-9]|-|_)*([a-z]|[0-9])$";
        const subdomainMinLength: number = 4;
        const subdomainMaxLength: number = 20;
        // tslint:disable-next-line: tsr-detect-non-literal-regexp
        if (!subDomainString.match(new RegExp(subdomainRegex))) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.SubdomainRegexMatchFailure);
        }
        if (subDomainString.length < subdomainMinLength || subDomainString.length > subdomainMaxLength) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.SubdomainLengthCheckFailure);
        }
    }
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
    public static validateParentAssetFallbackKey = (parentAssetFallbackKey: string) => {
        try {
            Validations.validateRegex(parentAssetFallbackKey, parentAssetFallbackKeyRegex);
        } catch (error) {
            throw new BaseError(null, `ParentAssetFallbackKey: ${parentAssetFallbackKey} is not valid.`);
        }
    }
    public static validateParentAssetFallbackKeys = (parentAssetFallbackKeys: string[]) => {
        parentAssetFallbackKeys.forEach((parentAssetFallbackKey) => {
            Validations.validateParentAssetFallbackKey(parentAssetFallbackKey);
        })
    }
    public static validateNameServiceConfig = (nameServiceConfig: INameServiceConfigurationOverrides) => {
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
        public static getDomainConfigFileName = (cruxDomainId: CruxDomainId): string => {
            return `${cruxDomainId.components.domain}_client-config.json`;
        }
        public static getConfigCruxId = (cruxDomainId: CruxDomainId): CruxId => {
            return new CruxId({
                domain: cruxDomainId.components.domain,
                subdomain: CruxSpec.blockstack.configSubdomain,
            });
        }
        public static getCruxPayFilename = (cruxId: CruxId): string => {
            return `${cruxId.components.domain}_cruxpay.json`;
        }
        public static getCruxUserConfigFileName = (cruxId: CruxId): string => {
            return `${cruxId.components.domain}_user-config.json`;
        }
    },
    globalAssetList,
    idTranslator: IdTranslator,
    validations: Validations,
};
