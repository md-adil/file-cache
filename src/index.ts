import { Cache, Callback, Key, SetOption } from "./cache";
import { resolve } from "node:path";
const dir = resolve(".cache");

const cache = <T>(key: Key, cb: Callback<T>, opt: SetOption) => Cache.create(key, cb, { path: dir + "/cache", ...opt });

const query = { name: "somethings" };
const params = { hello: "somethings" };
(async () => {
    const data = await cache(
        [query, params],
        () => {
            console.log("Generating...");
            return "Wow! i am awesome";
        },
        { ttl: 1 }
    );
    // new Cache({ name: "cache" }).delete("with some key");
    const data2 = await cache(
        "with some keys",
        async () => {
            return fetch("http://api.github.com/users").then((x) => x.json());
        },
        { ttl: 100 }
    );
    console.log({ data, data2 });
})();
