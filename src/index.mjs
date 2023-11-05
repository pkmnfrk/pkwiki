#!/usr/bin/env node
import { isChildDirectory } from "./util.mjs";
import { compile } from "./compile.mjs";
import watch from "node-watch";

let inPath, outPath;
let doWatch = false;

for(let i = 2; i < process.argv.length; i++) {
    if(process.argv[i] === "--watch") {
        doWatch = true;
    } else {
        if(!inPath) {
            inPath = process.argv[i];
        } else if(!outPath) {
            outPath = process.argv[i];
        } else {
            console.error("Ignoring unknown parameter:", process.argv);
        }
    }
}

if(!inPath || !outPath) {
    console.error("Usage: pkwiki <inPath> <outPath>");
    process.exit(1);
}

if(isChildDirectory(outPath, inPath)) {
    console.error("Do not create the output directory inside the input directory. This WILL cause problems");
    process.exit(1);
}

if(doWatch) {
    console.error("Compiling...");
    compile(inPath, outPath).then(() => {
        console.log("Watching for changes...");
        watch(inPath, {
            persistent: true,
            recursive: true,
        }, (evt, filename) => {
            console.error("Compiling...");
            compile(inPath, outPath).catch((e) => {
                console.error(e);
            });
        })
    });

    process.on("SIGINT", () => {
        process.exit(0);
    });
} else {
    try {
        await compile(inPath, outPath);
    } catch(e) {
        console.error(e);
    }
}