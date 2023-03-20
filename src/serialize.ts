import type { Data } from "./interfaces";

export function serialize(data: unknown) {
    return JSON.stringify(data);
}

export function deserialize(content: Buffer): Data<unknown> {
    return JSON.parse(`${content}`);
}
