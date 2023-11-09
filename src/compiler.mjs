import { Page } from "./page.mjs";

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
     * @param {import("./fileloader.mjs").FileLoader} loader
     * @param {import("./filesaver.mjs").FileSaver} saver
     * @param {import("markdown-it")} md
     * @param {import("./tocgenerator.mjs").TOCGenerator} tocGenerator
     */
    constructor(loader, saver, md, tocGenerator) {
        this.#loader = loader;
        this.#saver = saver;
        this.#md = md;
        this.#tocGenerator = tocGenerator;
    }

    async compile() {
        const generateDate = new Date();

        await this.#saver.recreateFolder();

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
                console.error(e);
                throw new Error(`Encountered error processing page ${page.path}: ${e.message}`);
            }

            const env = {
                pages: Object.keys(this.#allPages),
            }
            let tokens = this.#md.parse(page.processed, env);
            tokens = this.#tocGenerator.handleToc(tokens);
            const html = this.#md.renderer.render(tokens, this.#md.options, env);
    
            const body = template.
                replace(/{{prefixedtitle}}/g, ` - ${page.title}`).
                replace(/{{title}}/g, page.title).
                replace(/{{generatedate}}/g, generateDate.toUTCString()).
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
            for(const [_, file] of source.matchAll(include)) {
                any = true;
                if(!this.#includeCache[file]) {
                    this.#includeCache[file] = await this.#loader.load(`_${file}.html`);
                }
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

