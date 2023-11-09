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
        const html = md.render("[[Hello]]", {
            pages: ["hello"],
        });
        
        assert.equal(html, `<p><a href="hello.html" class="wiki-link">Hello</a></p>\n`);
    });

    it("handles label correctly", function () {
        const html = md.render("[[Hello|World]]", {
            pages: ["hello"],
        });
        
        assert.equal(html, `<p><a href="hello.html" class="wiki-link">World</a></p>\n`);
    });

    it("handles label with spaces/special characters correctly", function () {
        const html = md.render("[[Hello|World star?!]]", {
            pages: ["hello"],
        });
        
        assert.equal(html, `<p><a href="hello.html" class="wiki-link">World star?!</a></p>\n`);
    });

    it("handles label with markup correctly", function () {
        const html = md.render("[[Hello|_World_ star]]", {
            pages: ["hello"],
        });
        
        assert.equal(html, `<p><a href="hello.html" class="wiki-link"><em>World</em> star</a></p>\n`);
    });

    it("handles anchor correctly", function () {
        const html = md.render("[[Hello#World]]", {
            pages: ["hello"],
        });
        
        assert.equal(html, `<p><a href="hello.html#World" class="wiki-link">Hello</a></p>\n`);
    });

    it("handles anchor and label correctly", function () {
        const html = md.render("[[Hello#World|For the king!]]", {
            pages: ["hello"],
        });
        
        assert.equal(html, `<p><a href="hello.html#World" class="wiki-link">For the king!</a></p>\n`);
    });

    it("handles surrounding text correctly", function () {
        const html = md.render("aaa[[Hello#World]]bbb", {
            pages: ["hello"],
        });
        
        assert.equal(html, `<p>aaa<a href="hello.html#World" class="wiki-link">Hello</a>bbb</p>\n`);
    });
    
    it("handles broken link correctly", function () {
        const html = md.render("[[Hello#World]]", {
            pages: [],
        });
        
        assert.equal(html, `<p><a href="hello.html#World" class="wiki-link broken">Hello</a></p>\n`);
    });

    it("handles broken link with label correctly", function () {
        const html = md.render("[[Hello#World|foobar]]", {
            pages: [],
        });
        
        assert.equal(html, `<p><a href="hello.html#World" class="wiki-link broken">foobar</a></p>\n`);
    });

    it("handles broken link with 404 page correctly", function () {
        const html = md.render("[[Hello#World]]", {
            pages: ["404"],
        });
        
        assert.equal(html, `<p><a href="404.html#Hello" class="wiki-link broken">Hello</a></p>\n`);
    });

    it("handles broken link with label with 404 page correctly", function () {
        const html = md.render("[[Hello#World|foobar]]", {
            pages: ["404"],
        });
        
        assert.equal(html, `<p><a href="404.html#Hello" class="wiki-link broken">foobar</a></p>\n`);
    });
});