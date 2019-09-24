import * as OpenPay from "./index";
declare global {
    interface Window {
        OpenPay: object;
    }
}
window.OpenPay = OpenPay;
