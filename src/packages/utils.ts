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

export {
    httpJSONRequest,
};
