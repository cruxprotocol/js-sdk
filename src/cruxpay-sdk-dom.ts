import * as CruxPay from "./index";
declare global {
    interface Window {
        CruxPay: object;
    }
}
window.CruxPay = CruxPay;
