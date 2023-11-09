import {basename} from "path";
import { safeName } from "./util.mjs";

export class Page {
    /** @type {string} */
    source;
    /** @type {string} */
    processed;
    /** @type {string} */
    title;

    /**
     * 
     * @param {string} id 
     * @param {string} path 
     */
    constructor(id, path) {
        this.id = id;
        this.path = path;
    }

    static fromFilename(file) {
        const id = safeName(basename(file, ".md"));
        return new Page(id, file);
    }
}