import { writeFile, readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { sha1 } from "./hash";
import { deserialize, serialize } from "./serialize";

function time() {
    return Date.now();
}

export interface BaseOption {
    ttl?: number;
}

export interface SetOption extends BaseOption {}

export type Callback<T> = (cache: Cache) => PromiseLike<T> | T;

export type Key = any;
export type Data<T> = Record<string, [T, number] | [T]>;

export interface CacheOption extends BaseOption {
    ttl?: number;
    path: string;
}

export class Cache {
    #data: Data<unknown> | null = null;
    #path: string;

    constructor(public readonly opt: CacheOption) {
        this.#path = path.resolve(opt.path);
    }

    async exists(key: Key): Promise<string | null> {
        const data = await this.#read();
        key = this.#getKey(key);
        if (!(key in data)) {
            return null;
        }
        const [, ttl] = data[key];
        if (ttl === 0) {
            return null;
        }
        if (ttl && ttl < time()) {
            return null;
        }
        return key;
    }

    async remember<T>(key: Key, seconds: number | undefined, callback: Callback<T>) {
        let data: T = await this.get(key);
        if (!data) {
            data = await callback(this);
            await this.set(key, data, { ttl: seconds });
        }
        return data;
    }

    async rememberForever<T>(key: Key, callback: Callback<T>) {
        return this.remember(key, undefined, callback);
    }

    clean() {
        this.#data = {};
        return this.#sync();
    }

    async remove(key: Key) {
        const data = await this.#read();
        key = this.#getKey(key);
        delete data[key];
        await this.#sync();
        return this;
    }

    async set(key: Key, value: unknown, config: SetOption = {}) {
        const data = await this.#read();
        key = this.#getKey(key);
        const ttl = this.#getTTL(config.ttl ?? this.opt.ttl);
        if (ttl === null) {
            data[key] = [value];
        } else {
            data[key] = [value, ttl];
        }
        return this.#sync();
    }

    async get(key: Key, def?: any) {
        const data = await this.#read();
        key = await this.exists(key);
        if (!key) {
            return def;
        }
        const [value] = data[key];
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

    async #sync() {
        try {
            await writeFile(this.#path, serialize(this.#data));
        } catch (err: any) {
            if (err.code === "ENOENT") {
                await mkdir(path.dirname(this.#path), { recursive: true });
                await this.#sync();
                return;
            }
            throw err;
        }
    }
    async #read(): Promise<Data<unknown>> {
        if (this.#data) {
            return this.#data;
        }
        try {
            this.#data = deserialize(await readFile(this.#path, { encoding: "utf-8" }));
        } catch (err) {
            this.#data = {};
        }
        return this.#data;
    }
}
