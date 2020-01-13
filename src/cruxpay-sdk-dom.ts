import * as CruxPay from "./index";
import { InMemStorage } from "./index";

declare global {
    interface Window {
        CruxPay: object;
        inmemStorage: InMemStorage;
    }
}
window.CruxPay = CruxPay;
window.inmemStorage = new InMemStorage();
