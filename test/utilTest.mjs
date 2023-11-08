import assert from "assert";

import { splitByPipe } from "../src/util.mjs";


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