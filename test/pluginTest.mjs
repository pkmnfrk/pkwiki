import assert from "assert";
import MarkdownIt from "markdown-it";
import { wikiLink_plugin } from "../src/plugins.mjs";

describe("WikiLinkPlugin", function () {
    /** @type {import("markdown-it")} */
    let md;

    beforeEach(function () {
        md = new MarkdownIt()
            .use(wikiLink_plugin);
    });

    it("parses a wiki link correctly", function () {
        const html = md.render("[[Hello]]");
        
        assert.equal(html, `<p><a href="hello.html" class="wiki-link">Hello</a></p>\n`);
    });

    it("handles label correctly", function () {
        const html = md.render("[[Hello|World]]");
        
        assert.equal(html, `<p><a href="hello.html" class="wiki-link">World</a></p>\n`);
    });

    it("handles label with spaces/special characters correctly", function () {
        const html = md.render("[[Hello|World star?!]]");
        
        assert.equal(html, `<p><a href="hello.html" class="wiki-link">World star?!</a></p>\n`);
    });

    it.skip("handles label with markup correctly", function () {
        const html = md.render("[[Hello|_World_ star]]");
        
        assert.equal(html, `<p><a href="hello.html" class="wiki-link"><em>World</em></a></p>\n`);
    });

    it("handles anchor correctly", function () {
        const html = md.render("[[Hello#World]]");
        
        assert.equal(html, `<p><a href="hello.html#World" class="wiki-link">Hello</a></p>\n`);
    });

    it("handles anchor and label correctly", function () {
        const html = md.render("[[Hello#World|For the king!]]");
        
        assert.equal(html, `<p><a href="hello.html#World" class="wiki-link">For the king!</a></p>\n`);
    });

    it("handles surrounding text correctly", function () {
        const html = md.render("aaa[[Hello#World]]bbb");
        
        assert.equal(html, `<p>aaa<a href="hello.html#World" class="wiki-link">Hello</a>bbb</p>\n`);
    });
});