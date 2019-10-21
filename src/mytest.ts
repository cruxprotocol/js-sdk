// if (window !== undefined && window.crypto !== undefined) {
//     const crypto = window.crypto;
// } else {
//     // tslint:disable-next-line:no-var-requires
//     const crypto = require("crypto");
// }

// tslint:disable-next-line:no-var-requires
const crypto = require("crypto");

// tslint:disable-next-line:no-var-requires
const stream = require("stream");

interface Global {
    crypto: any;
}
declare const global: Global;
global.crypto = crypto;

export class Encryption1 {
    public static digest = async (str: string) => {
        return await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    }
}
