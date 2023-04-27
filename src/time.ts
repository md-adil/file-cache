export function time() {
    return Date.now();
}
export function getTTL(ttl?: number) {
    if (ttl === 0) {
        return 0;
    }
    if (!ttl) {
        return null;
    }
    return time() + ttl * 1000;
}
