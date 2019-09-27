import request from "request";
import { getLogger } from "../index";

const log = getLogger(__filename);

const httpJSONRequest = (options: (request.UriOptions & request.CoreOptions) | (request.UrlOptions & request.CoreOptions)): Promise<object> => {
    const promise: Promise<object> = new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) { reject(new Error(error)); }
            // log.debug(response)
            resolve(body);
        });
    });
    return promise;
};

const groupLogs = (groupIdentifier: string): (target: object, propertyName: string, propertyDesciptor?: TypedPropertyDescriptor<any>) => any => {
    const decorator = (target: object, propertyName: string, propertyDesciptor?: TypedPropertyDescriptor<any>): any => {
        let fn: any;
        let decoratedFn: any;

        if (propertyDesciptor) {
            fn = propertyDesciptor.value;
        }

        return {
            configurable: true,
            enumerable: false,
            get() {
                if (!decoratedFn) {
                    decoratedFn = async (...args: any[]) => {
                        console.groupCollapsed(`${groupIdentifier}`);
                        try {
                            const fnResponse = await fn.call(this, ...args);
                            return fnResponse;
                        } finally {
                            console.groupEnd();
                        }
                    };
                    return decoratedFn;
                }
            },
            set(newFn: any) {
                decoratedFn = undefined;
                fn = newFn;
            },
        };
    };
    return decorator;
};

export {
    httpJSONRequest,
    groupLogs,
};
