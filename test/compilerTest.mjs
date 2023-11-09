import assert from "assert";
import { Compiler } from "../src/compile.mjs";
import * as toc from "../src/toc.mjs";

import sinon from "sinon";

/**
 * @typedef FakeSaver
 * @prop {Record<string, string>} saved
 */

const fakeLoader = {
    load(path) {
        switch(path) {
            case "a.md": return "#title foobar\n\nHello World";
            case "b.md": return "#title links\n\n[[A]]\n[[A|blah]]";
            case "c.md": return "#title broken links\n\n[[Broken]]\n[[Broken|foo]]";
            case "d.md": return "#title toc\n\n{{#toc}}\n\n# heading 1\n\n# heading 2\n\n## heading 2.1";
            case "_template.html": return "{{title}}\n{{prefixedtitle}}\n{{body}}";
            default: throw new Error("unexpected load: " + path);
        }
    },

    glob(path) {
        switch(path) {
            case "*.md": return ["a.md", "b.md", "c.md", "d.md"];
            case "**/*.{css,png,jpg,gif}": return [];
            default: throw new Error("unexpected glob: " + path);
        }
    },
};

async function * yieldArgs(...args) {
    for(const arg of args) {
        yield arg;
    }
}

function createMocks() {
    const loader = {
        load: sinon.stub(),
        glob: sinon.stub(),
    };
    const saver = {
        save: sinon.stub(),
        recreateFolder: sinon.stub(),
    }
    const md = {
        parse: sinon.stub().returns([]),
        renderer: {
            render: sinon.stub().returns("rendered"),
        },
        options: "lol",
    }
    const toc = {
        handleToc: sinon.stub(),
    };

    return [loader, saver, md, toc];
}

describe("Compiler", () => {

    it("does basic functionality", async () => {
        const [loader, saver, md, toc] = createMocks();
        loader.load
            .onCall(0).resolves("<p>{{body}}</p>")  //template
            .onCall(1).resolves(""); //a.md
        loader.glob
            .onCall(0).returns(yieldArgs("a.md"))
            .onCall(1).returns(yieldArgs());

        const compiler = new Compiler(loader, saver, md, toc);

        await compiler.compile();

        sinon.assert.calledOnceWithExactly(saver.recreateFolder);
        sinon.assert.calledWithExactly(loader.load, "_template.html");
        sinon.assert.calledWithExactly(loader.glob, "*.md");
        sinon.assert.calledWithExactly(loader.load, "a.md");
        sinon.assert.calledWithExactly(md.parse, "", { pages: ["a"] });
        sinon.assert.calledWithExactly(toc.handleToc, []);
        sinon.assert.calledWithExactly(md.renderer.render, [], "lol", { pages: ["a"] });

        sinon.assert.calledWithExactly(saver.save, "a.html", "<p>rendered</p>");
    });

    it.skip("writes page", async () => {
        
        await compiler.compile();
        assert.equal(fakeSaver.saved["a.html"], "foobar\n - foobar\n<p>Hello World</p>\n");
    });

    it.skip("creates links to other pages", async () => {
        await compiler.compile();
        assert.equal(fakeSaver.saved["b.html"], `links\n - links\n<p><a href="a.html">A</a>\n<a href="a.html">blah</a></p>\n`);
    });

    it.skip("creates broken links", async () => {
        await compiler.compile();
        assert.equal(fakeSaver.saved["c.html"], `broken links\n - broken links\n<p><a href="broken.html" class="broken">Broken</a>\n<a href="broken.html" class="broken">foo</a></p>\n`);
    });

    it.skip("creates TOC", async () => {
        await compiler.compile();
        assert.equal(fakeSaver.saved["d.html"], `toc\n - toc\n<p>{{#toc}}</p>\n<p><h1>heading 1</h1></p>\n<p><h1>heading 2</h1></p><p><h2>heading 2.1</h2></p>\n`);
    });


})