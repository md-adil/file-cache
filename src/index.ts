import { Cache, CacheOption, Callback, Key, SetOption } from "./cache";
import { homedir } from "node:os";
import { resolve } from "node:path";
const { name } = require("../package.json");
const dir = resolve(homedir(), ".config", name);

Cache.defaults.dir = dir;

const cache = <T>(key: Key, cb: Callback<T>, opt: SetOption) => Cache.create(key, cb, { name: "cache", ...opt });

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

    const data2 = await cache(
        "with some key",
        async () => {
            console.log("getting data");
            return "Wow! i am awesome something";
        },
        { ttl: 60 }
    );

    console.log({ data, data2 });
})();
