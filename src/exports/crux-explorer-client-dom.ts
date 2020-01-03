import { CruxExplorerClient } from "../clients/crux-explorer-client";
import { CruxSpec } from "../core/entities/crux-spec";

declare global {
    interface Window {
        CruxExplorerClient: typeof CruxExplorerClient;
        CruxSpec: typeof CruxSpec;
    }
}
window.CruxExplorerClient = CruxExplorerClient;
window.CruxSpec = CruxSpec;
