import { dirname, join } from "path";
import { promises as fs } from "fs";
import { safeMkdir, safeRm } from "./util.mjs";

export class FileSaver {
    #outPath;

    constructor(outPath) {
        this.#outPath = outPath;
    }
    
    async save(path, content) {
        const finalPath = join(this.#outPath, path);

        await safeMkdir(dirname(finalPath));

        return await fs.writeFile(finalPath, content, "utf-8");
    }

    async saveBinary(path, content) {
        const finalPath = join(this.#outPath, path);

        await safeMkdir(dirname(finalPath));

        return await fs.writeFile(finalPath, content);
    }

    async recreateFolder() {
        await safeRm(this.#outPath);
        await safeMkdir(this.#outPath);
    }

    async rm(path) {
        const finalPath = join(this.#outPath, path);
        await safeRm(finalPath);
    }

    async mkdir(path) {
        const finalPath = join(this.#outPath, path);
        await safeMkdir(finalPath);
    }
}

