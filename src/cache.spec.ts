import { mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { Cache } from "./cache";
import { deserialize } from "./serialize";
import { resolve } from "path";
import v8 from "v8";

let cache1: Cache,
    cache2: Cache,
    dir = resolve("tmp"),
    filename = resolve(dir, ".cache");
beforeEach(() => {
    cache1 = new Cache({ path: filename });
    cache2 = new Cache({ path: filename });
});

afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
});

test("Simple setter and getter", async () => {
    expect(await cache1.get('name')).toBeUndefined();
    await cache1.set("name", "Adil");
    expect(await cache2.get("name")).toBe("Adil");
});

test("Setter and getter with timeout", async () => {
    jest.useFakeTimers();
    await cache1.set("name", "Adil", { ttl: 60 });
    expect(await cache2.get("name")).toBe("Adil");
    jest.advanceTimersByTime(1000 * 61);
    expect(await cache2.get("name")).toBeUndefined();
    jest.useRealTimers();
});

test("With default getter", async () => {
    expect(await cache1.get("something", "not exist")).toBe("not exist");
});

test("test with not existed cache path", async () => {
    const p = "./something/not-exists/cache";
    const cache = new Cache({ path: p });
    await cache.set("name", "Adil");
    expect(await cache.get("name")).toBe("Adil");
    rmSync("./something", { recursive: true });
});

test("test with object key", async () => {
    const cache = new Cache({ path: "/tmp/cache" });
    await cache.set({ name: "something" }, "Adil");
    expect(await cache.get({ name: "something" })).toBe("Adil");
});

test("test remember", async () => {
    const data = await cache1.remember(["something"], 1000, () => {
        return "something is cool";
    });
    expect(data).toBe("something is cool");
    const data2 = await cache2.remember(["something"], 1000, () => {
        return "something is not cool";
    });
    expect(data2).not.toBe("something is not cool");
});

test("remember with timeout", async () => {
    jest.useFakeTimers();
    const cache = new Cache({ path: "./tmp/cache-timeout-remember" });
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

test("with zero timeout", async () => {
    await cache1.set("name", "Something different", { ttl: 0 });
    expect(await cache1.get("name")).toBeUndefined();
});

test("clean", async () => {
    await cache1.set("name", "something");
    await cache1.clean();
    expect(await cache2.get("name")).toBeUndefined();
});

test("expect an error when try to access readonly files", async () => {
    const cache = new Cache({ path: "/something.cache" });
    await expect(() => cache.set("name", "Adil")).rejects.toThrow();
});

test("delete old cache from storage", async () => {
    jest.useFakeTimers();
    const read = () => deserialize(readFileSync(filename));
    await cache1.set("name", "Something", { ttl: 10 });
    expect(read()["name"][0]).toBe("Something");
    jest.advanceTimersByTime(1000 * 12);
    expect(await cache1.get("name")).toBeUndefined();
    await cache1.set("something", "something else");
    expect(read()["name"]).toBeUndefined();
});

test("custom serializer", async () => {
    const cache = new Cache({ path: filename, serializer: v8 });
    await cache.set("name", "adil");
    const content = readFileSync(filename);
    const data = v8.deserialize(content);
    expect(data.name).toEqual(["adil"]);
    expect(await cache.get("name")).toBe("adil");
});

test('auto correct invalid format', async () => {
    const f = resolve(dir, 'invalid-cache');
    mkdirSync(dir);
    writeFileSync(f, 'somehting invalid format');
    const cache = new Cache({ path: f });
    expect(await cache.get('name')).toBeUndefined();
    await cache.set('name', 'something important');
    expect(await cache.get('name')).toBe('something important');
    const cache2 = new Cache({ path: f });
    expect(await cache2.get('name')).toBe('something important');
})