import { readFileSync, rmSync } from "fs";
import { Cache } from "./cache";
import { deserialize } from "../serialize";

let cache1: Cache, cache2: Cache;
beforeEach(() => {
    cache1 = new Cache({ path: "./tmp/.cache-sync" });
    cache2 = new Cache({ path: "./tmp/.cache-sync" });
});

afterEach(() => {
    rmSync("./tmp", { recursive: true, force: true });
});

test("Simple setter and getter", () => {
    cache1.set("name", "Adil");
    expect(cache2.get("name")).toBe("Adil");
});

test("Setter and getter with timeout", () => {
    jest.useFakeTimers();
    cache1.set("name", "Adil", { ttl: 60 });
    expect(cache2.get("name")).toBe("Adil");
    jest.advanceTimersByTime(1000 * 61);
    expect(cache2.get("name")).toBeUndefined();
    jest.useRealTimers();
});

test("With default getter", () => {
    expect(cache1.get("something", "not exist")).toBe("not exist");
});

test("test with not existed cache path", () => {
    const p = "./something/not-exists/cache";
    const cache = new Cache({ path: p });
    cache.set("name", "Adil");
    expect(cache.get("name")).toBe("Adil");
    rmSync("./something", { recursive: true });
});

test("test with object key", () => {
    const cache = new Cache({ path: "/tmp/cache" });
    cache.set({ name: "something" }, "Adil");
    expect(cache.get({ name: "something" })).toBe("Adil");
});

test("test remember", () => {
    const data = cache1.remember(["something"], 1000, () => {
        return "something is cool";
    });
    expect(data).toBe("something is cool");
    const data2 = cache2.remember(["something"], 1000, () => {
        return "something is not cool";
    });
    expect(data2).not.toBe("something is not cool");
});

test("remember with timeout", () => {
    jest.useFakeTimers();
    const cache = new Cache({ path: "./tmp/cache-timeout-remember-sync" });
    const data = cache.remember(["something"], 1000, () => {
        return "something is cool";
    });
    expect(data).toBe("something is cool");
    jest.advanceTimersByTime(1001 * 1000);
    const data2 = cache.remember(["something"], 1000, () => {
        return "something is not cool";
    });
    expect(data2).toBe("something is not cool");
    jest.useRealTimers();
});

test("delete cache", () => {
    const cache = new Cache({ path: "/tmp/to-be-deleted" });
    cache.set("name", "something");
    expect(cache.get("name")).toBe("something");
    cache.remove("name");
    expect(cache.get("name")).toBeUndefined();
});

test("with zero timeout", () => {
    cache1.set("name", "Something different", { ttl: 0 });
    expect(cache1.get("name")).toBeUndefined();
});

test("clean", () => {
    cache1.set("name", "something");
    cache1.clean();
    expect(cache2.get("name")).toBeUndefined();
});

test("expect an error when try to access readonly files", () => {
    const cache = new Cache({ path: "/something.cache" });
    expect(() => cache.set("name", "Adil")).toThrow();
});

test("delete old cache from storage", () => {
    jest.useFakeTimers();
    const read = () => deserialize(readFileSync("./tmp/.cache-sync", { encoding: "utf-8" }));
    cache1.set("name", "Something", { ttl: 10 });
    expect(read()["name"][0]).toBe("Something");
    jest.advanceTimersByTime(1000 * 12);
    expect(cache1.get("name")).toBeUndefined();
    cache1.set("something", "something else");
    expect(read()["name"]).toBeUndefined();
});