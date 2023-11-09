import sinon from "sinon";
import { promises as fs } from "fs";

import { FileSaver } from "../src/filesaver.mjs";

describe("FileSaver", function () {
    /** @type {sinon.SinonStubbedInstance<typeof fs>} */
    let fsMock;
    /** @type {FileSaver} */
    let saver;

    beforeEach(function () {
        fsMock = sinon.stub(fs);
        saver = new FileSaver("base");
    });

    afterEach(function () {
        sinon.restore();
    });

    describe("save", function () {
        it("should save the expected file", async function () {
            fsMock.writeFile.resolves();

            await saver.save("foo", "bar baz");

            sinon.assert.calledOnceWithExactly(fsMock.mkdir, "base");
            sinon.assert.calledOnceWithExactly(fsMock.writeFile, "base/foo", "bar baz", "utf-8");
        });
    });

    describe("saveBinary", function () {
        it("should save the expected file", async function () {
            fsMock.writeFile.resolves();

            await saver.saveBinary("foo", "bar baz");

            sinon.assert.calledOnceWithExactly(fsMock.mkdir, "base");
            sinon.assert.calledOnceWithExactly(fsMock.writeFile, "base/foo", "bar baz");
        });
    });

    describe("recreateFolder", function () {
        it("should delete and create the base dir", async function () {
            await saver.recreateFolder();

            sinon.assert.calledOnceWithExactly(fsMock.rm, "base", {recursive: true});
            sinon.assert.calledOnceWithExactly(fsMock.mkdir, "base");
        });
    });

    describe("rm", function () {
        it("should delete the specified folder", async function () {
            await saver.rm("foo");

            sinon.assert.calledOnceWithExactly(fsMock.rm, "base/foo", {recursive: true});
        });
    });

    describe("mkdir", function () {
        it("should create the specified folder", async function () {
            await saver.mkdir("foo");

            sinon.assert.calledOnceWithExactly(fsMock.mkdir, "base/foo");
        });
    });



});