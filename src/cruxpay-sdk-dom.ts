import "regenerator-runtime";
import * as CruxPay from "./backward-compatibility";
import * as Crux from "./index";

declare global {
    interface Window {
        Crux: object;
        CruxPay: object;
        inmemStorage: Crux.InMemStorage;
    }
}
window.Crux = Crux;
window.CruxPay = CruxPay;
window.inmemStorage = new Crux.InMemStorage();
