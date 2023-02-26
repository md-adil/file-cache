import { Cache, CacheOption, Callback, Key, SetOption } from "./cache";
import { homedir } from "node:os";
import { resolve } from "node:path";
const { name } = require("../package.json");
const dir = resolve(homedir(), ".config", name);

Cache.defaults.dir = dir;

const cache = <T>(key: Key, cb: Callback<T>, opt: SetOption) => Cache.create(key, cb, { name: "cache", ...opt });

(async () => {
    const data = await cache(
        "keys",
        () => {
            console.log("Calling from hello");
            return "Wow! i am awesome";
        },
        { ttl: 60 }
    );

    const data2 = await cache(
        ["something another", { name: "adil" }],
        async () => {
            return "Woow! i am awesome something";
        },
        { ttl: 60 }
    );
    console.log({ data2, data });
})();
