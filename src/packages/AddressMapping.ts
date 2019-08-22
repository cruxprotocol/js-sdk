interface IAddressObject {
    address: string
    tag: string
}

interface IAddressMapping {
    [currency: string]: IAddressObject
}

export class AddressMapping {
    constructor(values: IAddressMapping | any = {}) {
        Object.assign(this, values);
    }
    toJSON() {
        return Object.assign({}, this)
    }
}
// {
//     "btc": {
//         "address": "some",
//         "tag": null
//     },
//     "eth": {
//         "address": "someeht",
//         "tag": null
//     },
// }