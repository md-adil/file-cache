import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { sha1 } from "./hash";

function time() {
    return Date.now();
}

export interface BaseOption {
    ttl?: number;
}

export interface SetOption extends BaseOption {}

export type Callback<T> = (cache: Cache) => PromiseLike<T> | T;

export type Key = any;
export type Data<T> = Record<string, [T, number | null]>;

export interface CacheOption extends BaseOption {
    ttl?: number;
    path: string;
}

export class Cache {
    static defaults: Omit<CacheOption, "path"> = {};

    static async create<T>(key: Key, callback: Callback<T>, { ttl, ...opt }: CacheOption) {
        const cache = new Cache(opt);
        let data: T = cache.get(key);
        if (!data) {
            data = await callback(cache);
            cache.set(key, data, { ttl });
        }
        return data;
    }

    #data: Data<unknown>;
    #path: string;

    constructor(public readonly opt: CacheOption) {
        this.#path = path.resolve(opt.path);
        this.#data = this.#read(this.#path);
    }

    exists(key: Key): string | null {
        key = this.#getKey(key);
        if (!(key in this.#data)) {
            return null;
        }
        const [, ttl] = this.#data[key];
        if (ttl === 0) {
            return null;
        }
        if (ttl && ttl < time()) {
            return null;
        }
        return key;
    }

    clean() {
        this.#data = {};
        this.#sync();
    }

    delete(key: Key) {
        key = this.#getKey(key);
        delete this.#data[key];
        this.#sync();
        return this;
    }

    set(key: Key, value: unknown, config: SetOption = {}) {
        key = this.#getKey(key);
        this.#data[key] = [value, this.#getTTL(config.ttl ?? this.opt.ttl)];
        this.#sync();
        return this;
    }

    get(key: Key, def?: any) {
        key = this.exists(key);
        if (!key) {
            return def;
        }
        const [value] = this.#data[key];
        return value;
    }
    #getTTL(ttl?: number) {
        if (ttl === 0) {
            return 0;
        }
        if (!ttl) {
            return null;
        }
        return time() + ttl * 1000;
    }
    #getKey(name: Key) {
        if (typeof name === "string") {
            return name;
        }
        return sha1(JSON.stringify(name));
    }
    #sync() {
        try {
            writeFileSync(this.#path, JSON.stringify(this.#data));
        } catch (err: any) {
            if (err.code === "ENOENT") {
                mkdirSync(path.dirname(this.#path), { recursive: true });
                this.#sync();
                return;
            }
            throw err;
        }
    }
    #read(loc: string): Data<unknown> {
        try {
            return JSON.parse(readFileSync(loc, { encoding: "utf-8" }));
        } catch (err) {
            return {};
        }
    }
}
