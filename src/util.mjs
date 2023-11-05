import {promises as fs} from "fs";

export async function safeRm(path) {
    try {
        await fs.rm(path, {recursive: true});
    } catch(e) {}
}

export async function safeMkdir(path) {
    try {
        await fs.mkdir(path);
    } catch(e){}
}

export function safeName(name) {
    return name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
}