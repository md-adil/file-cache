export type Data<T> = Record<string, [T, number] | [T]>;

export interface Serializer {
    deserialize(raw: Buffer): Data<unknown>;
    serialize(data: unknown): Buffer | string;
}

export interface BaseOption {
    ttl?: number;
}

export interface BaseCacheOption extends BaseOption {
    ttl?: number;
    path: string;
    serializer?: Serializer;
}

export interface SetOption extends BaseOption {}
