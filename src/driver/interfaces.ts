export interface Driver {
    read(fn: string): Promise<Buffer>;
    write(fn: string, content: Buffer | string): Promise<boolean>;
}
