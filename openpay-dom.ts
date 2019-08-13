import { IPayIDClaim, IPaymentRequest, OpenPayWallet, OpenPayService, Storage, Encryption } from "./index";

let OpenPay = {
    OpenPayWallet: OpenPayWallet,
    OpenPayService: OpenPayService,
    Storage: Storage,
    Encryption: Encryption
}

window.CoinSwitch = {...window.CoinSwitch , ...OpenPay}