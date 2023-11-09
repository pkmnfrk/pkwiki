import assert from "assert";
import { Compiler } from "../src/compiler.mjs";

import sinon from "sinon";

async function * yieldArgs(...args) {
    for(const arg of args) {
        yield arg;
    }
}

function createMocks() {
    const loader = {
        load: sinon.stub(),
        loadBinary: sinon.stub(),
        glob: sinon.stub(),
    };
    const saver = {
        save: sinon.stub(),
        saveBinary: sinon.stub(),
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
        handleToc: sinon.stub().returnsArg(0),
    };

    return [loader, saver, md, toc];
}

describe("Compiler", () => {

    it("does basic functionality", async () => {
        const [loader, saver, md, toc] = createMocks();
        loader.load
            .onCall(0).resolves("<p>{{body}}</p>")  //template
            .onCall(1).resolves("{{smth|foo}}\n#title baa\n#fake\n") //a.md
            .onCall(2).resolves("{{#1}}{{#2|aaa}}") //_smth.html
            ;
        loader.loadBinary
            .onCall(0).resolves("haa");
        loader.glob
            .onCall(0).returns(yieldArgs("a.md"))
            .onCall(1).returns(yieldArgs("blah.css"));

        const compiler = new Compiler(loader, saver, md, toc);

        await compiler.compile();

        sinon.assert.calledOnceWithExactly(saver.recreateFolder);
        sinon.assert.calledWithExactly(loader.load, "_template.html");
        sinon.assert.calledWithExactly(loader.glob, "*.md");
        sinon.assert.calledWithExactly(loader.load, "a.md");
        sinon.assert.calledWithExactly(loader.load, "_smth.html");
        sinon.assert.calledWithExactly(loader.loadBinary, "blah.css");
        sinon.assert.calledWithExactly(saver.saveBinary, "blah.css", "haa");
        sinon.assert.calledWithExactly(md.parse, "fooaaa\n\n#fake\n", { pages: ["a"] });
        sinon.assert.calledWithExactly(toc.handleToc, []);
        sinon.assert.calledWithExactly(md.renderer.render, [], "lol", { pages: ["a"] });

        sinon.assert.calledWithExactly(saver.save, "a.html", "<p>rendered</p>");
    });

    it("throws on infinite template recursion", async () => {
        const [loader, saver, md, toc] = createMocks();
        loader.load
            .onCall(0).resolves("<p>{{body}}</p>")  //template
            .onCall(1).resolves("{{smth}}") //a.md
            .onCall(2).resolves("{{smth}}") //_smth.html
            ;
        loader.glob
            .onCall(0).returns(yieldArgs("a.md"));

        const compiler = new Compiler(loader, saver, md, toc);

        let didNotThrow = true;
        try {
            await compiler.compile();
        } catch(e) {
            didNotThrow = false;
        }

        if(didNotThrow) {
            throw new Error("Did not throw exception");
        }
    });
})