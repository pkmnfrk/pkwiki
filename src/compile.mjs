import MarkdownIt from "markdown-it";
import markdownItHeadinganchor from "markdown-it-headinganchor";

import { safeName } from "./util.mjs";
import { basename, dirname } from "path";
import { handleToc } from "./toc.mjs";
import { FileLoader } from "./file-loader.mjs";
import { FileSaver } from "./file-saver.mjs";

const md = new MarkdownIt("default", {
    html: true,
}).use(markdownItHeadinganchor, {
    addHeadingId: true,
    addHeadingAnchor: false,
});

export class Compiler {
    #loader;
    #saver;
    #md;
    #allPages;
    #includeCache;

    constructor(inPath, outPath) {
        this.#loader = new FileLoader(inPath);
        this.#saver = new FileSaver(outPath);

        this.#md = new MarkdownIt("default", {
            html: true,
        }).use(markdownItHeadinganchor, {
            addHeadingId: true,
            addHeadingAnchor: false,
        });
    }

    async compile() {
        this.#saver.recreateFolder();

        const template = await this.#loader.load("_template.html");
    
        const files = await this.#loader.glob("*.md");
    
        this.#allPages = {};
        this.#includeCache = {};

        for await(const file of files) {
            try {
                const source = await this.#loader.load(file);
                const processedSource = await this.#processFile(source);
                const baseName = safeName(basename(file, ".md"));
                const page = {
                    raw: source,
                    baseName,
                    title: baseName,
                    ...processedSource,
                };
                this.#allPages[baseName] = page;
            } catch(e) {
                throw new Error(`Encountered error processing page ${file}: ${e.message}`);
            }
        }
    
        for(const page of Object.values(this.#allPages)) {
            const reProcessed = await this.#processFile(page.raw);
            //const html = md.render(reProcessed.text);
            const env = {}
            const tokens = this.#md.parse(reProcessed.text, env);
            handleToc(tokens, this.#md);
            const html = md.renderer.render(tokens, this.#md.options, env);
    
            const body = template.
                replace("{{prefixedtitle}}", ` - ${page.title}`).
                replace("{{title}}", page.title).
                replace("{{body}}", html);
    
            await this.#saver.save(`${page.baseName}.html`, body);
        }
    
        for await (const file of this.#loader.glob("**/*.{css,png,jpg,gif}")) {
            const buf = await this.#loader.loadBinary(file);
            await this.#saver.saveBinary(file, buf);
        }
    
    }

    /**
     * 
     * @param {string} source 
     * @param {FileLoader} loader 
     * @returns 
     */
    async #processFile(source) {
        const link = /\[\[(.*?)(?:\|(.*?))?\]\]/g;
        const pragma = /^#(\w+)(.*)$/gm;
        const include = /\{\{([^#].*?)(?:\|(.*))?\}\}/g;
        const includeArg = /(?<!\\)\|/g;
        const includeParam = /{{#(\d)(?:\|(.*?))?}}/g;
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
                if(!this.#includeCache[file]) {
                    files.push(file);
                }
                return substr;
            });

            for(const file of files) {
                this.#includeCache[file] = await this.#loader.load(`_${file}.html`);
            }

            // now, we can safely assume the templates are loaded
            source = source.replace(include, (substr, file, param) => {
                const params = param ? param.split(includeArg) : [];
                const tpl = this.#includeCache[file].replace(includeParam, (substr, num, defValue) => {
                    num = parseInt(num, 10) - 1;
                    if(params.length > num) {
                        return params[num].replace(/\\\|/g, "|");
                    }
                    return defValue;
                });

                return tpl;
            });

            if(includeDepth-- < 0) {
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

            if(!this.#allPages[dest]) {
                className = "broken";
                if(this.#allPages["404"]) {
                    dest = "404";
                }
            }

            return `<a href="${dest}.html${anchor ? `#${anchor}` : ""}"${className ? ` class="${className}"` : ""}>${title}</a>`;
        }).replace(pragma, (substr, keyword, args) => {
            switch(keyword) {
                case "title":
                    props.title = args.trim();
                    return "";
                // case "toc":
                //     return "${toc}";
            }
            return substr;
        })

        // console.log(source);

        return props;
    }
}

