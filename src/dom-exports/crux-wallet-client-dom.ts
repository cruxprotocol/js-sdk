import "regenerator-runtime";
import { CruxClientError, CruxSpec, CruxWalletClient, InMemStorage} from "../index";

declare global {
    interface Window {
        CruxWalletClient: typeof CruxWalletClient;
        CruxSpec: typeof CruxSpec;
        CruxClientError: typeof CruxClientError;
        InMemStorage: typeof InMemStorage;
    }
}
window.CruxWalletClient = CruxWalletClient;
window.CruxClientError = CruxClientError;
window.CruxSpec = CruxSpec;
window.InMemStorage = InMemStorage;
