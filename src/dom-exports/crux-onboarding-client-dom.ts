import "regenerator-runtime";
import { CruxOnBoardingClientError, CruxSpec, CruxWalletClient } from "../index";

declare global {
    interface Window {
        CruxWalletClient: typeof CruxWalletClient;
        CruxSpec: typeof CruxSpec;
        CruxOnBoardingClientError: typeof CruxOnBoardingClientError;
    }
}
window.CruxWalletClient = CruxWalletClient;
window.CruxOnBoardingClientError = CruxOnBoardingClientError;
window.CruxSpec = CruxSpec;
