# Cache Class

> This is a Cache class implemented in TypeScript that provides functionality for caching data into file/s with TTL.

## installing

    yarn add node-fs-cache // npm i --save node-fs-cache

## Usage

The Cache class can be used as follows:

```typescript
import { Cache } from "node-fs-cache";

const cache = new Cache({ path: "/path/to/cache/directory" });
await cache.set("key", "value");
const value = await cache.get("key");
```

## Methods

    constructor(opt: CacheOption)

The constructor takes an object of type CacheOption as its parameter. It initializes a new instance of the Cache class with the specified options.

    exists(key: Key): Promise<string | null>

This method checks if the specified key exists in the cache. If it does, the method returns the key. If it does not, the method returns null.

    remember<T>(key: Key, seconds: number | undefined, callback: Callback<T>): Promise<T>

This method checks if the specified key exists in the cache. If it does, the method returns the cached value. If it does not, the method calls the specified callback function to get the value, caches it, and returns it.

    rememberForever<T>(key: Key, callback: Callback<T>): Promise<T>

This method is similar to the remember method, but it caches the value forever.

    clean(): Promise<void>

This method clears the cache.

    remove(key: Key): Promise<Cache>

This method removes the specified key from the cache.

    set(key: Key, value: unknown, config: SetOption = {}): Promise<void>

This method adds the specified key and value to the cache. It takes an optional configuration object that allows you to specify a time-to-live (TTL) value for the cached data.

    get(key: Key, def?: any): Promise<any>

This method retrieves the value associated with the specified key from the cache. If the key does not exist in the cache, the method returns the default value specified in the second parameter.

---

## Types

    CacheOption

An interface that specifies the options that can be passed to the constructor of the Cache class.

```ts
interface CacheOption {
    path: string;
    ttl?: number; // seconds
    serializer?: Serializer;
    driver?: Driver;
}
```

    Data<T>

An interface that specifies the shape of the cache data.

```ts
interface Data<T> {
    [key: string]: [T] | [T, number];
}
```

    Serializer

Custom serializer like `import serializer form 'v8'` or `import serializer from 'bson'`

```ts
export interface Serializer {
    deserialize(raw: Buffer): Data<unknown>;
    serialize(data: unknown): Buffer | string;
}
```

    Driver

File system driver

```ts
export interface Driver {
    read(filename: string): Promise<Buffer>;
    write(filename: string, content: Buffer | string): Promise<boolean>;
}
```

    SetOption

An interface that specifies the configuration options that can be passed to the set method of the Cache class.

```ts
interface SetOption {
    ttl?: number;
}
```

    Key

A type that represents the cache key. It can be either a string or a number.

```ts
type Key = string | number;
```

    Callback<T>

A type that represents a callback function that can be used with the `remember` and `rememberForever` methods of the Cache class.

```ts
type Callback<T> = (cache: Cache) => PromiseLike<T> | T;
```

---

## Cache Class (sync)

This is same but synchronous.

## Usage

The Cache class can be used as follows:

```typescript
import { Cache } from "node-fs-cache/sync";

const cache = new Cache({ path: "/path/to/cache/directory" });
cache.set("key", "value");
const value = cache.get("key");
```

## Methods

    constructor(opt: CacheOption)

The constructor takes an object of type CacheOption as its parameter. It initializes a new instance of the Cache class with the specified options.

    exists(key: Key): string | null

This method checks if the specified key exists in the cache. If it does, the method returns the key. If it does not, the method returns null.

    remember<T>(key: Key, seconds: number | undefined, callback: Callback<T>): T

This method checks if the specified key exists in the cache. If it does, the method returns the cached value. If it does not, the method calls the specified callback function to get the value, caches it, and returns it.

    rememberForever<T>(key: Key, callback: Callback<T>): T

This method is similar to the remember method, but it caches the value forever.

    clean(): void

This method clears the cache.

    remove(key: Key): Cache

This method removes the specified key from the cache.

    set(key: Key, value: unknown, config: SetOption = {}): void

This method adds the specified key and value to the cache. It takes an optional configuration object that allows you to specify a time-to-live (TTL) value for the cached data.

    get(key: Key, def?: any): any

This method retrieves the value associated with the specified key from the cache. If the key does not exist in the cache, the method returns the default value specified in the second parameter.

## Types

    CacheOption

An interface that specifies the options that can be passed to the constructor of the Cache class.

```ts
interface CacheOption {
    path: string;
    ttl?: number;
    serializer?: Serializer;
}
```

    Callback<T>

A type that represents a callback function that can be used with the `remember` and `rememberForever` methods of the Cache class.

```ts
type Callback<T> = (cache: Cache) => T;
```
