import * as assert from "assert";
import {
    ensureParenthesesWrapping,
    getExtractedString,
    matchBindingLine,
    stringQuoteDetails,
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

    it("extracts selection with quoted string at the end", () => {
        const wholeLine = `let str = types |> Array.map fsSig |> String.concat ", "`;
        // select bash
        const { extractedText, newLine } = getExtractedString(wholeLine, 10, 57);

        const expectedExtractedString = `types |> Array.map fsSig |> String.concat ", "`;
        const expectedWholeLine = `let str = extracted`;

        assert.equal(extractedText, expectedExtractedString);
        assert.equal(newLine, expectedWholeLine);
    });

});

describe("General Funcs: selectedStringPositions", () => {

    it("start and end quotes", () => {
        const selected = `"/usr/bin/bash"`;
        assert.deepEqual(stringQuoteDetails(selected),
        {
            containsWholeQuotedString: true,
            hasEndQuote: true,
            hasStartQuote: true,
        });
    });

    it("no start but with end quotes", () => {
        const selected = `/usr/bin/bash"`;
        assert.deepEqual(stringQuoteDetails(selected),
        {
            containsWholeQuotedString: false,
            hasEndQuote: true,
            hasStartQuote: false,
        });
    });

    it("start but no end quotes", () => {
        const selected = `"/usr/bin/bash`;
        assert.deepEqual(stringQuoteDetails(selected),
        {
            containsWholeQuotedString: false,
            hasEndQuote: false,
            hasStartQuote: true,
        });
    });

    it("no start quotes but ends with a complete string literal", () => {
        const selected = `types |> Array.map fsSig |> String.concat ", "`;
        assert.deepEqual(stringQuoteDetails(selected),
        {
            containsWholeQuotedString: true,
            hasEndQuote: true,
            hasStartQuote: false,
        });
    });

});

describe("General Funcs: matchBindingLine", () => {

    it("binding returns parts for binding name", () => {
        const line = `    let inlineMe = 1 + arg1`;
        assert.deepEqual(matchBindingLine("inlineMe")(line),
        {
            binding: "let",
            bindingName: "inlineMe",
            expression: "1 + arg1",
            indentation: "    ",
            requiresParens: true,
            typeAnnotation: null,
        });
    });

    it("binding returns parts for binding name with type annotation", () => {
        const line = `let expectedEvents :int list = []`;
        assert.deepEqual(matchBindingLine("expectedEvents")(line),
        {
            binding: "let",
            bindingName: "expectedEvents",
            expression: "[]",
            indentation: "",
            requiresParens: false,
            typeAnnotation: "int list",
        });
    });

});
