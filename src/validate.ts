import { Data } from "./interfaces";
import { makeKey } from "./key";
import { time } from "./time";

export class ExpiredError extends Error {}

export function validate<T>(data: Data<T>, key: string) {
    key = makeKey(key);
    if (!(key in data)) {
        return null;
    }
    const [, ttl] = data[key];
    if (ttl === 0) {
        return null;
    }
    if (ttl && ttl < time()) {
        throw new ExpiredError();
    }
    return key;
}
