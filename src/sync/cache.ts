import { writeFileSync as writeFile, readFileSync as readFile, mkdirSync as mkdir } from "node:fs";
import path from "node:path";
import { CacheOption, Data, Serializer, SetOption } from "../interfaces";
import { Key, makeKey } from "../key";
import * as serializer from "../serialize";
import { time } from "../time";

export type Callback<T> = (cache: Cache) => T;
export class Cache {
    #data: Data<unknown> | null = null;
    #path: string;
    #isDirty = false;
    #serializer: Serializer;

    constructor(public readonly opt: CacheOption) {
        this.#path = path.resolve(opt.path);
        this.#serializer = opt.serializer ?? serializer;
    }

    exists(key: Key): string | null {
        const data = this.#read();
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
            this.#sync();
            return null;
        }
        return key;
    }

    remember<T>(key: Key, seconds: number | undefined, callback: Callback<T>) {
        let data: T = this.get(key);
        if (!data) {
            data = callback(this);
            this.set(key, data, { ttl: seconds });
        }
        return data;
    }

    rememberForever<T>(key: Key, callback: Callback<T>) {
        return this.remember(key, undefined, callback);
    }

    clean() {
        this.#data = {};
        this.#sync();
        return this;
    }

    remove(key: Key) {
        const data = this.#read();
        key = makeKey(key);
        if (key in data) {
            delete data[key];
            this.#sync();
        }
        return this;
    }

    set(key: Key, value: unknown, config: SetOption = {}) {
        const data = this.#read();
        key = makeKey(key);
        const ttl = this.#getTTL(config.ttl ?? this.opt.ttl);
        if (ttl === null) {
            data[key] = [value];
        } else {
            data[key] = [value, ttl];
        }
        this.#sync();
        return this;
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

    #getTTL(ttl?: number) {
        if (ttl === 0) {
            return 0;
        }
        if (!ttl) {
            return null;
        }
        return time() + ttl * 1000;
    }

    #sync() {
        this.#isDirty = true;
        process.nextTick(() => this.#write());
    }

    #write() {
        if (!this.#isDirty) {
            return;
        }
        try {
            writeFile(this.#path, this.#serialize(this.#data));
            this.#isDirty = false;
        } catch (err: any) {
            if (err.code === "ENOENT") {
                this.#mkdir();
                this.#write();
                return;
            }
            throw err;
        }
    }
    #serialize(data: unknown) {
        return this.#serializer.serialize(data);
    }
    #deserialize(data: Buffer) {
        return this.#serializer.deserialize(data);
    }
    #mkdir() {
        mkdir(path.dirname(this.#path), { recursive: true });
    }
    #read(): Data<unknown> {
        if (this.#data) {
            return this.#data;
        }
        try {
            this.#data = this.#deserialize(readFile(this.#path));
        } catch (err) {
            this.#data = {};
        }
        return this.#data;
    }
}
