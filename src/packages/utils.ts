import request from "request";

/* istanbul ignore next */
const httpJSONRequest = (options: (request.UriOptions & request.CoreOptions) | (request.UrlOptions & request.CoreOptions)): Promise<object> => {
    const promise: Promise<object> = new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) { reject(new Error(error)); }
            resolve(body);
        });
    });
    return promise;
};

const sanitizePrivKey = (privKey: string): string => {
    if (privKey.length === 66 && privKey.slice(64) === "01") {
        privKey = privKey.slice(0, 64);
    }
    return privKey;
};

export {
    httpJSONRequest,
    sanitizePrivKey,
};
