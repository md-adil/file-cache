export type Key = any;

export type Data<T> = Record<string, [T, number] | [T]>;

export interface BaseOption {
    ttl?: number;
}

export interface CacheOption extends BaseOption {
    ttl?: number;
    path: string;
}
export interface SetOption extends BaseOption {}
