// import * as CruxPay from "./index";

// let CruxPay = CruxPay;
let footest1 = () => {
    return "footest1_ABCD";
};
global.footest1 = footest1;
// global.CruxPay = CruxPay;

// node_modules/.bin/browserify src/cruxpay-sdk-dom.ts --standalone CruxFoo > dist/new_bundle.js