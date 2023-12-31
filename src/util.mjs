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
    return name.
        replace(/[^a-zA-Z0-9]/g, "-").
        replace(/--+/g, "-").
        replace(/^-|-$/g, "").
        toLowerCase();
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

/**
 * splits a string into sections based on pipe (|) delimiters
 * ignores escaped pipes (\|), handling things like escaped backslashes
 * @param {string} str the input string
 * @param {number} maxCount if set, max nr of results. Should be >= 2, otherwise will just return a single element
 * @param {boolean} returnIndexes if set, return start/end pairs instead of actual strings
 */
export function splitByPipe(str, maxCount, returnIndexes) {
    let start = 0, ix = 0;
    const ret = [];

    if(typeof(maxCount) === "boolean") {
        returnIndexes = maxCount;
        maxCount = undefined;
    }

    while(ix < str.length && (typeof(maxCount) !== "number" || ret.length < maxCount - 1)) {
        if(str[ix] === "|") {
            if(returnIndexes) {
                ret.push([start, ix]);
            } else {
                ret.push(str.slice(start, ix));
            }
            start = ix + 1;
        } else if(str[ix] === "\\") {
            //whatever the next character is, we skip it
            ix += 1;
        }

        ix += 1;
    }

    if(start < str.length) {
        if(returnIndexes) {
            ret.push([start, str.length]);
        } else {
            ret.push(str.slice(start, str.length));
        }
    }

    if(ret.length === 0) {
        //always return at least one entry
        if(returnIndexes) {
            ret.push([0,0]);
        } else {
            ret.push("");
        }
    }

    return ret;

}