import * as CruxPay from "./index";
import {InMemStorage} from "./packages/inmem-storage";

declare global {
    interface Window {
        CruxPay: object;
        inmemStorage: InMemStorage;
    }
}
window.CruxPay = CruxPay;
window.inmemStorage = new InMemStorage();
