import * as assert from "assert";
import {
    ensureParenthesesWrapping,
    getExtractedString,
    wordIndexesInText
 } from "../general-funcs";

describe("General Funcs: ensureParenthesesWrapping", () => {

    it("doesn't wrap text without parentheses", () => {
        const actual = ensureParenthesesWrapping("wrap me");
        assert.equal(actual, "wrap me");
    });

    it("wraps missing start parentheses", () => {
        const actual = ensureParenthesesWrapping("wrap me)");
        assert.equal(actual, "(wrap me)");
    });

    it("wraps missing end parentheses", () => {
        const actual = ensureParenthesesWrapping("(wrap me");
        assert.equal(actual, "(wrap me)");
    });

    it("wraps multiple opening with missing end parentheses", () => {
        const actual = ensureParenthesesWrapping("(complete(wrap me)missing");
        assert.equal(actual, "(complete(wrap me)missing)");
    });

});

describe("General Funcs: wordIndexesInText", () => {

    it("with non-existent text finds no occurrences", () => {
        const actual = wordIndexesInText("ab cd ef be", "findme");
        assert.deepEqual(actual, []);
    });

    it("finds multiple occurrences", () => {
        const actual = wordIndexesInText("ab findme cd ef findme be", "findme");
        assert.deepEqual(actual, [3, 16]);
    });

});

describe("General Funcs: getExtractedString", () => {

    it("extracts start of quoted string with double quote selected", () => {
        const wholeLine = `let stringToExtract = "/usr/bin/bash"`;
        // select "/usr/bin/
        const { extractedText, newLine } = getExtractedString(wholeLine, 22, 32);

        const expectedExtractedString = `"/usr/bin/"`;
        const expectedWholeLine = `let stringToExtract = extracted + "bash"`;

        assert.equal(extractedText, expectedExtractedString);
        assert.equal(newLine, expectedWholeLine);
    });

    it("extracts end of quoted string with double quote selected", () => {
        const wholeLine = `let stringToExtract = "/usr/bin/bash"`;
        // select bash"
        const { extractedText, newLine } = getExtractedString(wholeLine, 32, 37);

        const expectedExtractedString = `"bash"`;
        const expectedWholeLine = `let stringToExtract = "/usr/bin/" + extracted`;

        assert.equal(extractedText, expectedExtractedString);
        assert.equal(newLine, expectedWholeLine);
    });

    it("extracts middle of quoted string", () => {
        const wholeLine = `let stringToExtract = "/usr/bin/bash"`;
        // select bash
        const { extractedText, newLine } = getExtractedString(wholeLine, 27, 31);

        const expectedExtractedString = `"/bin"`;
        const expectedWholeLine = `let stringToExtract = "/usr" + extracted + "/bash"`;

        assert.equal(extractedText, expectedExtractedString);
        assert.equal(newLine, expectedWholeLine);
    });

});
