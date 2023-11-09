import { createRequire } from "module";
import sinon from "sinon";
import { promises as fs } from "fs";
// import glob from "glob";
const require = createRequire(import.meta.url);
const glob = require("glob");

import { FileLoader } from "../src/fileloader.mjs";
import assert from "assert";


describe("FileLoader", function () {
    /** @type {sinon.SinonStubbedInstance<typeof fs>} */
    let fsMock;
    /** @type {sinon.SinonStub<glob.globIterate>} */
    let globIterateMock;
    /** @type {FileLoader} */
    let loader;

    beforeEach(function () {
        fsMock = sinon.stub(fs);
        globIterateMock = sinon.stub(glob, "globIterate");
        loader = new FileLoader("base");
    });

    afterEach(function () {
        sinon.restore();
    });

    describe("load", function () {
        it("should load the expected file", async function () {
            fsMock.readFile.resolves("blah");

            const result = await loader.load("foo");

            sinon.assert.calledOnceWithExactly(fsMock.readFile, "base/foo", "utf-8");
            assert.equal(result, "blah");
        });
    });

    describe("loadBinary", function () {
        it("should load the expected file", async function () {
            fsMock.readFile.resolves("blah");

            const result = await loader.loadBinary("foo");

            sinon.assert.calledOnceWithExactly(fsMock.readFile, "base/foo");
            assert.equal(result, "blah");
        });
    });

    describe("glob", function () {
        it("should return the globbed files, minus prefix", async function () {
            globIterateMock.returns((async function * () {
                yield "base/foo";
                yield "base/baz/bar";
            })());

            const result = [];
            for await(const f of loader.glob("foo")) {
                result.push(f);
            }

            sinon.assert.calledOnceWithExactly(globIterateMock, "base/foo");
            assert.deepEqual(result, ["foo", "baz/bar"]);

        });
    })
});