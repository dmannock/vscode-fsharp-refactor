import * as assert from "assert";
import {
    ensureParenthesesWrapping,
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
