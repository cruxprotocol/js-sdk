let config: any;

if (process.env.NODE_ENV === "prod") {
    config = require('./config.prod.json');
} else {
    config = require('./config.json');
}

export default config