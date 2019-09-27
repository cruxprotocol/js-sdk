let config: any;

if (process.env.NODE_ENV === "prod") {
    // tslint:disable-next-line:no-var-requires
    config = require("./config.prod.json");
} else {
    // tslint:disable-next-line:no-var-requires
    config = require("./config.json");
}

export default config;
