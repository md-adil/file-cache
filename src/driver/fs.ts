import { writeFile, readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { Driver } from "./interfaces";

export class FSDriver implements Driver {
    read(fn: string): Promise<Buffer> {
        return readFile(fn);
    }
    async write(fn: string, content: Buffer): Promise<boolean> {
        try {
            await writeFile(fn, content);
            return true;
        } catch (err: any) {
            if (err.code === "ENOENT") {
                await mkdir(path.dirname(fn), { recursive: true });
                await this.write(fn, content);
                return true;
            }
            throw err;
        }
    }
}
