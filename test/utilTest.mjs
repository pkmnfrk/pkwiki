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
});