import type { Data } from "./cache";

export function serialize(data: unknown) {
    return JSON.stringify(data);
}

export function deserialize(content: string): Data<unknown> {
    return JSON.parse(content);
}
