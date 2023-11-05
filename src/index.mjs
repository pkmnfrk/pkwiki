#!/usr/bin/env node

import MarkdownIt from "markdown-it";
import markdownItHeadinganchor from "markdown-it-headinganchor";

import { safeMkdir, safeRm, safeName } from "./util.mjs";
import { promises as fs } from "fs";
import {join, basename, dirname} from "path";
import {glob} from "glob";

const md = new MarkdownIt("default", {
    html: true,
}).use(markdownItHeadinganchor, {
    addHeadingId: true,
    addHeadingAnchor: false,
});

const inPath = process.argv[2];
const outPath = process.argv[3];

await safeRm(outPath);
await safeMkdir(outPath);

const template = await fs.readFile(join(inPath, "_template.html"), "utf-8");

const files = await glob(join(inPath, "*.md"));

const allPages = {};
const includeCache = {};

for(const file of files) {
    const source = await fs.readFile(file, "utf-8");
    const processedSource = await processFile(source);
    const baseName = safeName(basename(file, ".md"));
    const page = {
        raw: source,
        baseName,
        title: baseName,
        ...processedSource,
    };
    allPages[baseName] = page;
}

for(const page of Object.values(allPages)) {
    const reProcessed = await processFile(page.raw);
    const html = md.render(reProcessed.text);

    const body = template.
        replace("{{prefixedtitle}}", ` - ${page.title}`).
        replace("{{title}}", page.title).
        replace("{{body}}", html);
    
    console.log("Writing", page.baseName);

    await fs.writeFile(join(outPath, `${page.baseName}.html`), body, "utf-8");   
}

for(const file of await glob(join(inPath, "**/*.{css,png,jpg,gif}"))) {
    const subPath = join(outPath, file.substring(inPath.length));

    const dir = dirname(subPath);
    console.log("Creating", dir);
    await safeMkdir(dir);
    await fs.copyFile(file, subPath);
}

async function processFile(source) {
    const link = /\[\[(.*?)(?:\|(.*?))?\]\]/g;
    const pragma = /^#(\w+)(.*)$/gm;
    const include = /\{\{([^#].*?)(?:\|(.*))?\}\}/g;
    const includeArg = /(?<!\\)\|/g;
    const includeParam = /{{#(\d)(?:\|.*?)?}}/g;
    const props = {

    };

    // first, resolve any includes. Basically, keep looping until we either hit the limit or stop including things
    let any = false;
    let includeDepth = 500;

    do {
        any = false;
        // run it once to get new template files
        const files = [];
        source.replace(include, (substr, file) => {
            any = true;
            if(!includeCache[file]) {
                files.push(file);
            }
            return substr;
        });

        for(const file of files) {
            includeCache[file] = await fs.readFile(join(inPath, `_${file}.html`), "utf-8");
        }

        // now, we can safely assume the templates are loaded
        source = source.replace(include, (substr, file, param) => {
            const params = param ? param.split(includeArg) : [];
            console.log(params);
            const tpl = includeCache[file].replace(includeParam, (substr, num, defValue) => {
                num = parseInt(num, 10) - 1;
                if(params.length > num) {
                    return params[num].replace(/\\\|/g, "|");
                }
                return defValue;
            });

            return tpl;
        });

        if(includeDepth++ > 500) {
            throw new Error("Encountered likely infinite include chain");
        }
    } while(any);


    props.text = source.replace(link, (substr, dest, title) => {
        //console.log(dest, title);
        let anchor = "";
        if(dest.indexOf("#") !== -1) {
            [dest, anchor] = dest.split("#");
        }

        if(!title) {
            title = dest;
        }
        dest = safeName(dest);
        let className = "";

        if(!allPages[dest]) {
            className = "broken";
        }

        return `<a href="${dest}.html${anchor ? `#${anchor}` : ""}"${className ? ` class="${className}"` : ""}>${title}</a>`;
    }).replace(pragma, (substr, keyword, args) => {
        switch(keyword) {
            case "title":
                props.title = args.trim();
                break;
        }
        return "";
    })

    // console.log(source);

    return props;
}