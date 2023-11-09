import { createRequire } from "module";
import { join } from "path";
import { promises as fs } from "fs";
const require = createRequire(import.meta.url);
const glob = require("glob");

export class FileLoader {
    #inPath;

    constructor(inPath) {
        this.#inPath = inPath;
    }
    
    async load(path) {
        const finalPath = join(this.#inPath, path);

        return await fs.readFile(finalPath, "utf-8");
    }

    async loadBinary(path) {
        const finalPath = join(this.#inPath, path);

        return await fs.readFile(finalPath);
    }

    async * glob(pattern) {
        const finalPattern = join(this.#inPath, pattern);

        for await (const file of glob.globIterate(finalPattern)) {
            let retFile = file;
            if(retFile.indexOf(this.#inPath) === 0) {
                retFile = retFile.substring(this.#inPath.length + 1);
            }

            console.log(this.#inPath, retFile);

            yield retFile;
        }
    }
}

