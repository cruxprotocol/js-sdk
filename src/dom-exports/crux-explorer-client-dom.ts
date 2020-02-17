import "regenerator-runtime";
import { CruxExplorerClient, CruxSpec } from "../index";

declare global {
    interface Window {
        CruxExplorerClient: typeof CruxExplorerClient;
        CruxSpec: typeof CruxSpec;
    }
}
window.CruxExplorerClient = CruxExplorerClient;
window.CruxSpec = CruxSpec;
