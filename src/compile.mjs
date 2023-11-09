import { Page } from "./page.mjs";
import { safeName } from "./util.mjs";
import { basename, dirname } from "path";

export class Compiler {
    #loader;
    #saver;
    #md;
    #tocGenerator;
    /** @type {Record<string, Page>} */
    #allPages;
    #includeCache;

    /**
     * 
     * @param {import("./file-loader.mjs").FileLoader} loader
     * @param {import("./file-saver.mjs").FileSaver} saver
     * @param {import("markdown-it")} md
     * @param {import("./toc.mjs").TOCGenerator} tocGenerator
     */
    constructor(loader, saver, md, tocGenerator) {
        this.#loader = loader;
        this.#saver = saver;
        this.#md = md;
        this.#tocGenerator = tocGenerator;
    }

    async compile() {
        this.#saver.recreateFolder();

        const template = await this.#loader.load("_template.html");
    
        const files = await this.#loader.glob("*.md");
    
        this.#allPages = {};
        this.#includeCache = {};

        // pre-allocate the page data, so we know what does and does not exist
        for await(const file of files) {
            const page = Page.fromFilename(file);
            this.#allPages[page.id] = page;
        }

        for await(const page of Object.values(this.#allPages)) {
            try {
                page.source = await this.#loader.load(page.path);
                await this.#processFile(page);
            } catch(e) {
                throw new Error(`Encountered error processing page ${file}: ${e.message}`);
            }

            const env = {
                pages: Object.keys(this.#allPages),
            }
            const tokens = this.#md.parse(page.processed, env);
            this.#tocGenerator.handleToc(tokens);
            const html = this.#md.renderer.render(tokens, this.#md.options, env);
    
            const body = template.
                replace(/{{prefixedtitle}}/g, ` - ${page.title}`).
                replace(/{{title}}/g, page.title).
                replace(/{{body}}/g, html);
    
            await this.#saver.save(`${page.id}.html`, body);
        }
    
        for await (const file of this.#loader.glob("**/*.{css,png,jpg,gif}")) {
            const buf = await this.#loader.loadBinary(file);
            await this.#saver.saveBinary(file, buf);
        }
    
    }

    /**
     * 
     * @param {Page} page
     * @returns 
     */
    async #processFile(page) {
        const pragma = /^#(\w+)(.*)$/gm;
        const include = /\{\{([^#].*?)(?:\|(.*))?\}\}/g;
        const includeArg = /(?<!\\)\|/g;
        const includeParam = /{{#(\d)(?:\|(.*?))?}}/g;

        // first, resolve any includes. Basically, keep looping until we either hit the limit or stop including things
        let any = false;
        let includeDepth = 500;
        let source = page.source;

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


        page.processed = source.replace(pragma, (substr, keyword, args) => {
            switch(keyword) {
                case "title":
                    page.title = args.trim();
                    return "";
            }
            return substr;
        });
    }
}

