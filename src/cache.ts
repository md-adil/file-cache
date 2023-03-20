import { writeFile, readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { CacheOption, Data, SetOption } from "./interfaces";
import { Key, makeKey } from "./key";
import { deserialize, serialize } from "./serialize";
import { getTTL, time } from "./time";
export type Callback<T> = (cache: Cache) => PromiseLike<T> | T;

export class Cache {
    #data: Data<unknown> | null = null;
    #path: string;

    constructor(public readonly opt: CacheOption) {
        this.#path = path.resolve(opt.path);
    }

    async exists(key: Key): Promise<string | null> {
        const data = await this.#read();
        key = makeKey(key);
        if (!(key in data)) {
            return null;
        }
        const [, ttl] = data[key];
        if (ttl === 0) {
            return null;
        }
        if (ttl && ttl < time()) {
            delete data[key];
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
        key = makeKey(key);
        delete data[key];
        await this.#sync();
        return this;
    }

    async set(key: Key, value: unknown, config: SetOption = {}) {
        const data = await this.#read();
        key = makeKey(key);
        const ttl = getTTL(config.ttl ?? this.opt.ttl);
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
            this.#data = deserialize(await readFile(this.#path));
        } catch (err) {
            this.#data = {};
        }
        return this.#data;
    }
}
