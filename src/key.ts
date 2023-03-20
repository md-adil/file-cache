import { sha1 } from "./hash";

export type Key = any;

export function makeKey(k: Key) {
    return typeof k === "string" ? k : sha1(JSON.stringify(k));
}
