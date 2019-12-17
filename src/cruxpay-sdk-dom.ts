import * as CruxPay from "./index";

declare global {
    interface Window {
        CruxPay: object;
        inmemStorage: CruxPay.inmemStorage.InMemStorage;
    }
}
window.CruxPay = CruxPay;
window.inmemStorage = new CruxPay.inmemStorage.InMemStorage();
