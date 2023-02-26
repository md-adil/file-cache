import { createHash } from "crypto";

export function sha1(content: any) {
    return createHash("sha1").update(content).digest("hex");
}
