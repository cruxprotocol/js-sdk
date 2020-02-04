import { CruxClientError, CruxSpec, CruxWalletClient } from "../index";

declare global {
    interface Window {
        CruxWalletClient: typeof CruxWalletClient;
        CruxSpec: typeof CruxSpec;
        CruxClientError: typeof CruxClientError;
    }
}
window.CruxWalletClient = CruxWalletClient;
window.CruxClientError = CruxClientError;
window.CruxSpec = CruxSpec;
