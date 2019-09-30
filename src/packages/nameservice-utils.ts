import { AssertionError, deepStrictEqual } from "assert";
import { getLogger } from "..";
import * as Errors from "./errors";

const log = getLogger(__filename);

export let fetchNameDetails = async (blockstackId: string): Promise<object|undefined> => {
    const bnsNodes = this._bnsNodes;

    const nodeResponses = bnsNodes.map((baseUrl) => this._bnsResolveName(baseUrl, blockstackId));
    log.debug(`BNS node responses:`, nodeResponses);

    const responsesArr: object[] = await Promise.all(nodeResponses);
    log.debug(`BNS resolved JSON array:`, responsesArr);
    let prev_res;
    let response: object;
    for (let i = 0; i < responsesArr.length; i++) {
        const res = responsesArr[i];
        if (i === 0) {
            prev_res = res;
        } else {
            try {
                deepStrictEqual(prev_res, res);
            } catch (e) {
                if (e instanceof AssertionError) {
                    throw new Errors.ClientErrors.NameIntegrityCheckFailed("Name resolution integrity check failed.", 1100);
                } else {
                    log.error(e);
                    throw e;
                }
            }
        }
        // TODO: unhandled else case
        if (i === responsesArr.length - 1) {
            response = responsesArr[0];
        }
    }
    // @ts-ignore
    return response;
};
