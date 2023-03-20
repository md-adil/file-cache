## Async cache

```js
import { Cache } from "fs-cache";

const cache = new Cache({ path: "./.cache" });

// set
await cache.set("name", "John doe");

await cache.get("name"); // john doe

const users = await cache.remember(["users", 120, req.query], () => User.find());

console.log(users); // will be cached for 2 minutes
```

## Sync cache

```js
import { Cache } from "fs-cache/sync";

const cache = new Cache({ path: "./cache" });
cache.set("message", "some thing is awesome");
const message = cache.get("message");
console.log(message); // some thing is awesome
```
