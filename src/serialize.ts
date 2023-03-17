import type { Data } from "./interfaces";

export function serialize(data: unknown) {
    return JSON.stringify(data);
}

export function deserialize(content: string | Buffer): Data<unknown> {
    return JSON.parse(`${content}`);
}
