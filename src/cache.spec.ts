import { rmSync } from "fs";
import { Cache } from "./cache";

test("Simple setter and getter", async () => {
    const cache = new Cache({ path: "/tmp/cache" });
    await cache.set("name", "Adil");
    expect(await cache.get("name")).toBe("Adil");
});

test("Setter and getter with timeout", async () => {
    jest.useFakeTimers();
    const cache = new Cache({ path: "/tmp/cache" });
    await cache.set("name", "Adil", { ttl: 60 });
    expect(await cache.get("name")).toBe("Adil");
    jest.advanceTimersByTime(1000 * 61);
    expect(await cache.get("name")).toBeUndefined();
    jest.useRealTimers();
});

test("With default getter", async () => {
    const cache = new Cache({ path: "/tmp/not-cache" });
    expect(await cache.get("something", "not exist")).toBe("not exist");
});

test("test with not existed cache path", async () => {
    const cache = new Cache({ path: "/tmp/something/not-exists/cache" });
    await cache.set("name", "Adil");
    expect(await cache.get("name")).toBe("Adil");
});

test("test with object key", async () => {
    const cache = new Cache({ path: "/tmp/cache" });
    await cache.set({ name: "something" }, "Adil");
    expect(await cache.get({ name: "something" })).toBe("Adil");
});

test("test remember", async () => {
    const cache = new Cache({ path: "/tmp/cache-remember" });
    const data = await cache.remember(["something"], 1000, () => {
        return "something is cool";
    });
    expect(data).toBe("something is cool");
    const data2 = await cache.remember(["something"], 1000, () => {
        return "something is not cool";
    });
    expect(data2).not.toBe("something is not cool");
});

test("remember with timeout", async () => {
    jest.useFakeTimers();
    rmSync("/tmp/cache-timeout-remember");
    const cache = new Cache({ path: "/tmp/cache-timeout-remember" });
    const data = await cache.remember(["something"], 1000, () => {
        return "something is cool";
    });
    expect(data).toBe("something is cool");
    jest.advanceTimersByTime(1001 * 1000);
    const data2 = await cache.remember(["something"], 1000, () => {
        return "something is not cool";
    });
    expect(data2).toBe("something is not cool");
    jest.useRealTimers();
});

test("delete cache", async () => {
    const cache = new Cache({ path: "/tmp/to-be-deleted" });
    await cache.set("name", "something");
    expect(await cache.get("name")).toBe("something");
    await cache.remove("name");
    expect(await cache.get("name")).toBeUndefined();
});

test("clean", async () => {
    const cache = new Cache({ path: "/tmp/to-be-deleted" });
    await cache.set("name", "something");
    await cache.clean();
    expect(await cache.get("name")).toBeUndefined();
});
