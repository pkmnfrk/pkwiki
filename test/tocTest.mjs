import MarkdownIt from "markdown-it";
import assert from "assert";

import { TOCGenerator } from "../src/tocgenerator.mjs";
import markdownItHeadinganchor from "markdown-it-headinganchor";

describe("TOCGenerator", function () {
    const md = new MarkdownIt("default", {
        html: true,
    }).use(markdownItHeadinganchor, {
        addHeadingId: true,
        addHeadingAnchor: false,
    });
    const tocGenerator = new TOCGenerator(md)
    describe("handleToc", function () {
        it("should do nothing if no #toc", function () {
            const text = "# foo\n"
            const tokens = md.parse(text);
            const result = tocGenerator.handleToc(tokens);
            const html = md.renderer.render(result, md.options);

            assert.equal(html, `<h1 id="foo">foo</h1>\n`);
        });

        it("should replace #toc with nothing if no headers", function () {
            const text = "#toc"
            const tokens = md.parse(text);
            const result = tocGenerator.handleToc(tokens);
            const html = md.renderer.render(result, md.options);

            assert.equal(html, `<p></p>\n`);
        });

        it("should replace inline #toc with a table of contents", function () {
            const text = "# foo\n#toc\n## bar\n";
            const tokens = md.parse(text);
            const result = tocGenerator.handleToc(tokens);
            const html = md.renderer.render(result, md.options);

            assert.equal(html, `<h1 id="foo">foo</h1>
<p>
<ol class="table-of-contents">
<li><a href="#foo">foo</a></li>
</ol>
</p>
<h2 id="bar">bar</h2>
`);
        });
        it("should respect #toc level parameter", function () {
            const text = "# foo\n#toc 2\n## bar\n";
            const tokens = md.parse(text);
            const result = tocGenerator.handleToc(tokens);
            const html = md.renderer.render(result, md.options);

            assert.equal(html, `<h1 id="foo">foo</h1>
<p>
<ol class="table-of-contents">
<li><a href="#foo">foo</a>
<ol>
<li><a href="#bar">bar</a></li>
</ol>
</li>
</ol>
</p>
<h2 id="bar">bar</h2>
`);
        });
        it("should respect #toc even in html", function () {
            const text = "# foo\n\n<div>\n#toc\n</div>\n\n## bar\n";
            const tokens = md.parse(text);
            const result = tocGenerator.handleToc(tokens);
            const html = md.renderer.render(result, md.options);

            assert.equal(html, `<h1 id="foo">foo</h1>
<div>
<ol class="table-of-contents">
<li><a href="#foo">foo</a></li>
</ol>

</div>
<h2 id="bar">bar</h2>
`);
        });
    });
});
