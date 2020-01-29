import { CruxUser, IAddress } from "../../core/entities/crux-user";
import { BaseError, ErrorHelper, getLogger, PackageErrorCode } from "../../packages";
import { CruxAssetTranslator, IAssetMatcher } from "./crux-asset-translator";
const log = getLogger(__filename);
export interface ICruxAddressResolverOptions {
    cruxAssetTranslator: CruxAssetTranslator;
    cruxUser: CruxUser;
    userCruxAssetTranslator?: CruxAssetTranslator;
}
export class CruxAddressResolver {
    private cruxAssetTranslator: CruxAssetTranslator;
    private cruxUser: CruxUser;
    private userCruxAssetTranslator?: CruxAssetTranslator;
    constructor(options: ICruxAddressResolverOptions) {
        this.cruxAssetTranslator = options.cruxAssetTranslator;
        this.cruxUser = options.cruxUser;
        this.userCruxAssetTranslator = options.userCruxAssetTranslator;
        log.debug("CruxAddressResolver initialised");
    }
    public resolveAddressBySymbol = async (walletCurrencySymbol: string): Promise<IAddress> => {
        const assetId = this.cruxAssetTranslator.symbolToAssetId(walletCurrencySymbol);
        if (!assetId) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.AssetIDNotAvailable);
        }
        const userAddress = await this.resolveAddressWithAssetId(assetId);
        if (!userAddress) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.AddressNotAvailable);
        }
        return userAddress;
    }
    public resolveAddressByAssetMatcher = async (assetMatcher: IAssetMatcher): Promise<IAddress> => {
        log.debug("asset matcher provided:", assetMatcher);
        let userAddress: IAddress|undefined;
        if (!assetMatcher.assetIdentifierValue) {
            userAddress = await this.resolveAddressByAssetGroup(assetMatcher.assetGroup);
        } else {
            if (!this.userCruxAssetTranslator) {
                throw new BaseError(null, "user client's assetTranslator is required when assetIdentifierValue is provided");
            }
            // match the asset using the matcher provided
            const asset = this.userCruxAssetTranslator.assetMatcherToAsset(assetMatcher);
            if (!asset) {
                userAddress = await this.resolveAddressByAssetGroup(assetMatcher.assetGroup);
            } else {
                const assetParentFallbackKeyDetails = this.userCruxAssetTranslator.assetIdToParentFallbackKeyDetails(asset.assetId);
                const assetGroupParentFallbackKeyDetails = this.cruxAssetTranslator.symbolParentFallbackKeyToParentFallbackKeyDetails(assetMatcher.assetGroup);
                if (assetParentFallbackKeyDetails && (assetParentFallbackKeyDetails.assetIdFallbackKey === assetGroupParentFallbackKeyDetails.assetIdFallbackKey)) {
                    // resolve the address with the assetId only if the fallback key matches
                    userAddress = await this.cruxUser.getAddressWithAssetId(asset.assetId);
                    if (!userAddress) {
                        // if no address found, resolve with the fallback key
                        userAddress = await this.resolveAddressByAssetGroup(assetMatcher.assetGroup);
                    }
                }
            }
        }
        if (!userAddress) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.AddressNotAvailable);
        }
        return userAddress;
    }
    public resolveAddressWithAssetId = async (assetId: string): Promise<IAddress|undefined> => {
        let userAddress = this.cruxUser.getAddressWithAssetId(assetId);
        if (!userAddress) {
            // check if the asset has a valid parent fallback key
            const parentFallbackKeyDetails = this.cruxAssetTranslator.assetIdToParentFallbackKeyDetails(assetId);
            // resolve the fallback address if there is a capability
            if (parentFallbackKeyDetails) {
                userAddress = await this.resolveAddressByAssetGroup(parentFallbackKeyDetails.symbolFallbackKey);
            }
        }
        return userAddress;
    }
    public resolveAddressByAssetGroup = async (assetGroup: string): Promise<IAddress|undefined> => {
        let userAddress: IAddress|undefined;
        const enabledParentAssets = this.cruxUser.config.enabledParentAssetFallbacks;
        const decodedTokenType = this.cruxAssetTranslator.symbolParentFallbackKeyToParentFallbackKeyDetails(assetGroup);
        if (enabledParentAssets.includes(decodedTokenType.assetIdFallbackKey)) {
            userAddress = this.cruxUser.getAddressWithAssetId(decodedTokenType.parentAssetId);
        }
        return userAddress;
    }
}
