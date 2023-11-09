import assert from "assert";
import sinon from "sinon";

import { isChildDirectory, safeMkdir, safeName, safeRm, splitByPipe } from "../src/util.mjs";
import { promises as fs} from "fs";

describe("utils", function () {
    describe("safeRm", function () {
        let rmMock;
        this.beforeEach(function () {
            rmMock = sinon.stub(fs, "rm");
        });
        this.afterEach(function () {
            rmMock.restore();
        });

        it("should call rm", async function () {
            await safeRm("blah");

            sinon.assert.calledOnceWithExactly(rmMock, "blah", { recursive: true });
        });
        it("should succeed even if rm throws", async function () {
            rmMock.rejects(new Error("foo"));

            await safeRm("blah");

            sinon.assert.calledOnceWithExactly(rmMock, "blah", { recursive: true });
        });
    });

    describe("safeMkdir", function () {
        let mkdirMock;
        this.beforeEach(function () {
            mkdirMock = sinon.stub(fs, "mkdir");
        });
        this.afterEach(function () {
            mkdirMock.restore();
        });

        it("should call mkdir", async function () {
            await safeMkdir("blah");

            sinon.assert.calledOnceWithExactly(mkdirMock, "blah");
        });
        it("should succeed even if mkdir throws", async function () {
            mkdirMock.rejects(new Error("foo"));
            
            await safeMkdir("blah");

            sinon.assert.calledOnceWithExactly(mkdirMock, "blah");
        });
    });

    describe("safeName", function () {
        const cases = [
            ["foo", "foo"],
            ["FOO", "foo"],
            ["FoO", "foo"],
            ["foo bar", "foo-bar"],
            ["Foo? Bar!", "foo-bar"],
            ["Foo?Bar!", "foo-bar"],
            ["!!!!!!!!Foo??????????????Bar!!!!!!!!", "foo-bar"],
        ]

        cases.forEach(([unsafe, safe]) => {
            it(`should translate '${unsafe}' into '${safe}'`, function() {
                const result = safeName(unsafe);
                assert.equal(result, safe);
            })
        })
    });

    describe("isChildDirectory", function () {
        const cases = [
            ["foo", "bar", false],
            ["foo", "foo/bar", true],
            ["foo", "bar/foo", false],
            ["foo", "bar/foo/bar", false],
            ["foo", "foobar", false],
            ["foo", "foobar/bar", false]
        ]

        cases.forEach(([parent, child, isChild]) => {
            it(`should consider '${child}' to ${isChild ? "be" : "not be"} a child of ${parent}`, function () {
                const result = isChildDirectory(child, parent);
                assert.equal(result, isChild);
            });
        })
    });

    describe("splitByPipe", function () {
        it("empty string", function () {
            const result = splitByPipe("");

            assert.deepEqual(result, [""]);
        });
        it("no pipes", function () {
            const result = splitByPipe("foo");

            assert.deepEqual(result, ["foo"]);
        });
        it("one pipe", function () {
            const result = splitByPipe("foo|bar");

            assert.deepEqual(result, ["foo", "bar"]);
        })
        
        it("many pipe", function () {
            const result = splitByPipe("foo|bar|baz|quux");

            assert.deepEqual(result, ["foo", "bar", "baz", "quux"]);
        })

        it("escaped pipe", function () {
            const result = splitByPipe("foo\\|bar");

            assert.deepEqual(result, ["foo\\|bar"]);
        })
        it("not escaped pipe", function () {
            const result = splitByPipe("foo\\\\|bar");

            assert.deepEqual(result, ["foo\\\\", "bar"]);
        })
        it("ending with a backslash", function () {
            const result = splitByPipe("foo\\\\|bar\\");

            assert.deepEqual(result, ["foo\\\\", "bar\\"]);
        })
        
        it("max segments", function () {
            const result = splitByPipe("foo|bar|baz|quux", 2);

            assert.deepEqual(result, ["foo", "bar|baz|quux"]);
        })
        
        it("zero segments", function () {
            const result = splitByPipe("foo|bar|baz|quux", 0);

            assert.deepEqual(result, ["foo|bar|baz|quux"]);
        })

        it("empty string (indexes)", function () {
            const result = splitByPipe("", true);

            assert.deepEqual(result, [[0,0]]);
        });

        it("no pipes (indexes)", function () {
            const result = splitByPipe("foo", true);

            assert.deepEqual(result, [[0,3]]);
        });

        it("one pipe (indexes)", function () {
            const result = splitByPipe("foo|bar", true);

            assert.deepEqual(result, [[0, 3], [4, 7]]);
        })
        
        it("many pipe (indexes)", function () {
            const result = splitByPipe("foo|bar|baz|quux", true);

            assert.deepEqual(result, [[0, 3], [4, 7], [8, 11], [12, 16]]);
        })

        it("escaped pipe (indexes)", function () {
            const result = splitByPipe("foo\\|bar", true);

            assert.deepEqual(result, [[0, 8]]);
        });
        it("not escaped pipe (indexes)", function () {
            const result = splitByPipe("foo\\\\|bar", true);

            assert.deepEqual(result, [[0, 5], [6, 9]]);
        });
        it("ending with a backslash (indexes)", function () {
            const result = splitByPipe("foo\\\\|bar\\", true);

            assert.deepEqual(result, [[0, 5], [6, 10]]);
        });
        
        it("max segments (indexes)", function () {
            const result = splitByPipe("foo|bar|baz|quux", 2, true);

            assert.deepEqual(result, [[0,3], [4, 16]]);
        });
        
        it("zero segments (indexes)", function () {
            const result = splitByPipe("foo|bar|baz|quux", 0, true);

            assert.deepEqual(result, [[0, 16]]);
        });
    });
});