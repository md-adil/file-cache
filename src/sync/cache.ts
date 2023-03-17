import { writeFileSync as writeFile, readFileSync as readFile, mkdirSync as mkdir } from "node:fs";
import path from "node:path";
import { sha1 } from "../hash";
import { CacheOption, Data, Key, SetOption } from "../interfaces";
import { deserialize, serialize } from "../serialize";
import { getTTL, time } from "../time";

export type Callback<T> = (cache: Cache) => T;
export class Cache {
    #data: Data<unknown> | null = null;
    #path: string;

    constructor(public readonly opt: CacheOption) {
        this.#path = path.resolve(opt.path);
    }

    exists(key: Key): string | null {
        const data = this.#read();
        key = this.#getKey(key);
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

    remember<T>(key: Key, seconds: number, callback: Callback<T>) {
        let data: T = this.get(key);
        if (!data) {
            data = callback(this);
            this.set(key, data, { ttl: seconds });
        }
        return data;
    }

    clean() {
        this.#data = {};
        return this.#sync();
    }

    remove(key: Key) {
        const data = this.#read();
        key = this.#getKey(key);
        delete data[key];
        this.#sync();
        return this;
    }

    set(key: Key, value: unknown, config: SetOption = {}) {
        const data = this.#read();
        key = this.#getKey(key);
        const ttl = getTTL(config.ttl ?? this.opt.ttl);
        if (ttl === null) {
            data[key] = [value];
        } else {
            data[key] = [value, ttl];
        }
        return this.#sync();
    }

    get(key: Key, def?: any) {
        const data = this.#read();
        key = this.exists(key);
        if (!key) {
            return def;
        }
        const [value] = data[key];
        return value;
    }

    #getKey(name: Key) {
        if (typeof name === "string") {
            return name;
        }
        return sha1(JSON.stringify(name));
    }

    #sync() {
        try {
            writeFile(this.#path, serialize(this.#data));
        } catch (err: any) {
            if (err.code === "ENOENT") {
                mkdir(path.dirname(this.#path), { recursive: true });
                this.#sync();
                return;
            }
            throw err;
        }
    }
    #read(): Data<unknown> {
        if (this.#data) {
            return this.#data;
        }
        try {
            this.#data = deserialize(readFile(this.#path));
        } catch (err) {
            this.#data = {};
        }
        return this.#data;
    }
}
