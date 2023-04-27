import path from "node:path";
import { FSDriver } from "./driver/fs";
import type { Driver } from "./driver/interfaces";
import { BaseCacheOption, Data, Serializer, SetOption } from "./interfaces";
import { Key, makeKey } from "./key";
import * as serializer from "./serialize";
import { getTTL, time } from "./time";
export type Callback<T> = (cache: Cache) => PromiseLike<T> | T;
export interface CacheOption extends BaseCacheOption {
    driver?: Driver;
}

export class Cache {
    #data: Data<unknown> | null = null;
    #path: string;
    #serializer: Serializer;
    #driver: Driver;
    constructor(public readonly opt: CacheOption) {
        this.#path = path.resolve(opt.path);
        this.#serializer = opt.serializer ?? serializer;
        this.#driver = opt.driver ?? new FSDriver();
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
        await this.#driver.write(this.#path, this.#serializer.serialize(this.#data));
    }
    async #read(): Promise<Data<unknown>> {
        if (this.#data) {
            return this.#data;
        }
        try {
            const content = await this.#driver.read(this.#path);
            this.#data = this.#serializer.deserialize(content);
        } catch (err: any) {
            if (err.code === 'ENOENT') {
                this.#data = {};
                return this.#data;
            }
            if (!(err instanceof Error)) {
                throw err;
            }
            console.warn(err.message);
            this.#data = {};
        }
        return this.#data;
    }
}
