import {promises as fs} from "fs";
import {resolve, normalize, sep} from "path";

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

export function isChildDirectory(child, parent) {
    child = normalize(resolve(child));
    parent = normalize(resolve(parent));

    if(!child.endsWith(sep)) {
        child += sep;
    }
    if(!parent.endsWith(sep)) {
        parent += sep;
    }

    return child.indexOf(parent) === 0;

}

export function repeatString(char, num) {
    let ret = "";
    for(let i = 0; i < num; i++) {
        ret += char;
    }
    return ret;
}