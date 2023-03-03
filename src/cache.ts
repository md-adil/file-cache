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

export interface CacheOption extends BaseOption {
    ttl?: number;
    dir?: string;
    name: string;
}

export type Key = any;

export class Cache {
    static defaults: Omit<CacheOption, "name"> = {};

    static async create<T>(key: Key, callback: Callback<T>, { ttl, ...opt }: CacheOption) {
        const cache = new Cache(opt);
        let data: T = cache.get(key);
        if (!data) {
            data = await callback(cache);
            cache.set(key, data, { ttl });
        }
        return data;
    }

    #data: any;
    #location: string;

    constructor(public readonly opt: CacheOption) {
        this.#location = path.resolve(opt.dir ?? Cache.defaults.dir ?? "", opt.name);
        this.#data = this.#read(this.#location);
    }

    exists(key: Key): string | null {
        key = this.#getKey(key);
        if (!(key in this.#data)) {
            return null;
        }
        const [, ttl] = this.#data[key];
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

    set(key: Key, value: any, config: SetOption = {}) {
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
        if (!ttl) {
            return;
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
            writeFileSync(this.#location, JSON.stringify(this.#data));
        } catch (err: any) {
            if (err.code === "ENOENT" && this.opt.dir) {
                mkdirSync(this.opt.dir, { recursive: true });
                this.#sync();
                return;
            }
            throw err;
        }
    }
    #read(loc: string) {
        try {
            return JSON.parse(readFileSync(loc, { encoding: "utf-8" }));
        } catch (err) {
            return {};
        }
    }
}
