import { CruxWalletClient, ICruxWalletClientOptions } from "./application/clients/crux-wallet-client";
import { ICruxIDState } from "./application/clients/crux-wallet-client";
import config from "./config";
import { IAddressMapping } from "./core/entities/crux-user";
import * as errors from "./packages/error";
import * as inmemStorage from "./packages/inmem-storage";
import * as storage from "./packages/storage";

export {
    IAddressMapping,
    ICruxIDState,
    config,
    errors,
    inmemStorage,
    storage,
    CruxWalletClient as CruxClient,
    ICruxWalletClientOptions as ICruxClientOptions,
};

// Removed API (Unavailable)

// AddressMapping
// PayIDClaim
// blockstackService
// nameService
// cacheStorage
// encryption
