import { publicKeyToAddress, transactions} from "blockstack";
import { CruxDomain } from "../../domain-entities/crux-domain";
import { CruxSpec } from "../../domain-entities/crux-spec";
import { DomainRegistrationStatus, ICruxDomainRepository, IKeyManager } from "../../domain-entities/index";
import { IClientConfig } from "../../packages/configuration-service";
import { BaseError, ErrorHelper, PackageErrorCode } from "../../packages/error";
import { getContentFromGaiaHub } from "../../packages/gaia-service/utils";
import { getLogger } from "../../packages/logger";
import { fetchNameDetails, getCruxDomainByAddress as getCruxDomainsByAddress } from "../../packages/name-service/utils";
import { GaiaService } from "../services/gaia-service";

const log = getLogger(__filename);

export interface IBlockstackCruxDomainRepositoryOptions {
    bnsNodes?: string[];
    paymentKeyManager?: IKeyManager;
    domainAddress?: string;
    domainNameOverride?: string;
}

export class BlockstackCruxDomainRepository implements ICruxDomainRepository {
    private _bnsNodes: string[];
    private _paymentKeyManager?: IKeyManager;
    private _domainAddress?: string;
    private _domainNameOverride?: string;

    constructor(options: IBlockstackCruxDomainRepositoryOptions) {
        this._bnsNodes = options.bnsNodes || CruxSpec.blockstack.bnsNodes;
        this._paymentKeyManager = options.paymentKeyManager;
        this._domainAddress = options.domainAddress;
        this._domainNameOverride = options.domainNameOverride;
        log.info("BlockstackCruxDomainRepository initialised");
    }

    public find = async (domain: string): Promise<boolean> => {
        const domainRegistrationStatus = await this._getDomainRegistrationStatus(domain);
        return domainRegistrationStatus === DomainRegistrationStatus.DONE ? false : true;
    }

    public create = async (domain: string, keyManager: IKeyManager): Promise<CruxDomain> => {
        // [1] register the domain on blockchain;
        const domainAddress = this._domainAddress || publicKeyToAddress(await keyManager.getPubKey());
        const paymentKeySigner = this._paymentKeyManager ? await this._paymentKeyManager.pubKeyHashSigner() : await keyManager.pubKeyHashSigner();
        // validate the zonefile written
        const registerTxn = transactions.makeRegister(`${domain}.id`, domainAddress, paymentKeySigner);
        // broadcast the register txn to the blockchain

        // [2]register the _config subdomain on blockchain
        // broadcast the register txn to the blockchain

        const initialClientConfig: IClientConfig = {
            assetList: [],
            assetMapping: {},
        };
        const cruxDomain: CruxDomain = new CruxDomain(domain, DomainRegistrationStatus.PENDING, initialClientConfig.assetMapping, initialClientConfig.assetList);
        return cruxDomain;
    }

    public get = async (domain?: string, keyManager?: IKeyManager): Promise<CruxDomain|null> => {
        let cruxDomain: CruxDomain | null = null;
        let registeredDomainName: string | null;

        if (domain) {
            registeredDomainName = domain;
            if (this._domainAddress) {
                // validate the domainAddress corresponds to the domain provided
                const registeredDomainNames = await getCruxDomainsByAddress(this._domainAddress, this._bnsNodes);
                if (registeredDomainNames && !registeredDomainNames.includes(domain)) {
                    throw new BaseError(null, "domainAddress mismatch");
                }
            }
            if (keyManager) {
                if (!this._domainAddress) {
                    const address = publicKeyToAddress(await keyManager.getPubKey());
                    const registeredDomainNames = await getCruxDomainsByAddress(address, this._bnsNodes);
                    if (registeredDomainNames && !registeredDomainNames.includes(domain)) {
                        throw new BaseError(null, "key mismatch");
                    }
                }
                // validate the keyManger corresponds to the domain provided
            }
        } else if (keyManager) {
            // find the cruxDomain associated with the keyManager
            const address = this._domainAddress || publicKeyToAddress(await keyManager.getPubKey());
            const registeredDomainNames = await getCruxDomainsByAddress(address, this._bnsNodes);
            registeredDomainName = registeredDomainNames && ((this._domainNameOverride && registeredDomainNames.includes(this._domainNameOverride) && this._domainNameOverride) || registeredDomainNames[0]);
        } else {
            registeredDomainName = null;
        }

        if (registeredDomainName) {
            const registrationStatus = await this._getDomainRegistrationStatus(registeredDomainName);
            if (registrationStatus === DomainRegistrationStatus.NONE) {
                throw ErrorHelper.getPackageError(null, PackageErrorCode.DomainNotRegistered, registeredDomainName);
            }
            const configID = CruxSpec.blockstack.getConfigID(registeredDomainName);
            const clientConfig: IClientConfig = await getContentFromGaiaHub(configID, CruxSpec.blockstack.getDomainConfigFileName(registeredDomainName), this._bnsNodes);
            cruxDomain = new CruxDomain(registeredDomainName, registrationStatus, clientConfig.assetMapping, clientConfig.assetList, clientConfig.nameserviceConfiguration);
        }
        return cruxDomain;
    }
    public save = async (cruxDomain: CruxDomain, keyManager: IKeyManager): Promise<void> => {
        const filename = CruxSpec.blockstack.getDomainConfigFileName(cruxDomain.domain);
        const newClientConfig: IClientConfig = {
            assetList: cruxDomain.assetList,
            assetMapping: cruxDomain.assetMap,
            nameserviceConfiguration: cruxDomain.nameServiceConfig,
        };
        const finalURL = await new GaiaService(CruxSpec.blockstack.gaiaWriteURL).uploadContentToGaiaHub(filename, newClientConfig, keyManager);
        log.info(`Final Gaia URL: ${finalURL}`);
        return;
    }

    private _getDomainRegistrationStatus = async (domain: string): Promise<DomainRegistrationStatus> => {
        // todo: interpret the domain registration status from blockchain/BNS node
        let domainRegistrationStatus: DomainRegistrationStatus = DomainRegistrationStatus.NONE;
        const nameDetails: any = await fetchNameDetails(`${domain}_crux.id`, this._bnsNodes);
        if (nameDetails) {
            if (nameDetails.status === "available") {
                domainRegistrationStatus = DomainRegistrationStatus.NONE;
            } else if (nameDetails.status === "registered") {
                domainRegistrationStatus = DomainRegistrationStatus.DONE;
            } else {
                domainRegistrationStatus = DomainRegistrationStatus.PENDING;
            }
        }
        return domainRegistrationStatus;
    }
}
