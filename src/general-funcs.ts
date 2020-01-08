"use strict";

const lambdaRegexPattern = `\\(fun([^-]+)->(.+)\\)`;
const createStringRegexPattern =
    (selectedText) => `${selectedText.startsWith(`"`)
        ? ""
        : `\\"`}(.*)${selectedText}(.*)${selectedText.endsWith(`"`)
        ? ""
        : `\\"`}`;

export interface IMatchedBindingLine {
    indentation: string;
    binding: string;
    bindingName: string;
    expression: string;
    typeAnnotation: string;
    requiresParens: boolean;
}

export function ensureParenthesesWrapping(text) {
    const bracketsCount = text
        .split("")
        .reduce((acc, cur) =>
            cur === "("
            ? Object.assign(acc, { open: acc.open + 1 })
            : cur === ")"
            ? Object.assign(acc, { close: acc.close + 1 })
            : acc,
        { open: 0, close: 0});
    return bracketsCount.open > bracketsCount.close
        ? text + ")"
        : bracketsCount.open < bracketsCount.close
        ? "(" + text
        : text;
}

export function isLambdaSelection(selectedText: string) {
    return new RegExp(lambdaRegexPattern).test(selectedText);
}

export function isStringSelection(selectedText: string, wholeLine: string) {
    return new RegExp(createStringRegexPattern(selectedText)).test(wholeLine);
}

export function lambdaBindingFromSelection(text: string)  {
    const [, rawArgs, rawBody] = new RegExp(lambdaRegexPattern).exec(text);
    const args = rawArgs.split(" ").filter((x) => x);
    return {
        args,
        body: ensureParenthesesWrapping(rawBody).trim(),
    };
}

export const matchBindingLine = (bindingNameToMatch = "\\S+") => (text): IMatchedBindingLine => {
    const pattern = `^(\\s*)(let)\\s+\\b(${bindingNameToMatch})\\b\\s*(:([\\s\\S]+))?\\s*=\\s*([\\s\\S]+)$`;
    const matched = new RegExp(pattern).exec(text);
    if (!matched) {
        return null;
    }
    const [, indentation, binding, bindingName, , typeAnnotation, expression] = matched;
    const requiresParens = expression.trim().includes(" ") || expression.includes("(", 1);
    return {
        binding,
        bindingName,
        expression,
        indentation,
        requiresParens,
        typeAnnotation: typeAnnotation && typeAnnotation.trim(),
    };
};

export function wordIndexesInText(text: string, toFind: string): number[] {
    const found = [];
    const regex = new RegExp(`\\b${toFind}\\b`, "g");
    let match;
    do {
        match = regex.exec(text);
        if (match == null) {
            return found;
        }
        found.push(match.index);
    } while (true);
}

export function getExtractedString(textLine: string, selectionStartPos: number, selectionEndPos: number) {
    const initialBindingName = "extracted";
    const quoteChars = `"`;
    const selectedText = textLine.substring(selectionStartPos, selectionEndPos);

    const { hasStartQuote, hasEndQuote, containsWholeQuotedString } = stringQuoteDetails(selectedText, quoteChars);

    const textBeforeSelection = textLine.substring(0, selectionStartPos);
    const mid = textLine.substring(selectionStartPos, selectionStartPos);
    const textAfterSelection = textLine.substring(selectionEndPos, Infinity);

    const extractedText = `${!hasStartQuote && !containsWholeQuotedString
        ? `"` : ""}${selectedText}${!hasEndQuote ? `"` : ""}`;

    let newLine = "";
    // issue #1 - added to resolve that and only that
    if (!hasStartQuote && hasEndQuote && containsWholeQuotedString) {
        newLine = `${textBeforeSelection}${initialBindingName}`;
    } else {
        newLine = `${textBeforeSelection}`
            + `${hasStartQuote && !hasEndQuote
                ? `${initialBindingName} + ${quoteChars}${textAfterSelection}` : ""}`
            + `${hasEndQuote && !hasStartQuote
                ? `${mid}${quoteChars} + ${initialBindingName}` : ""}`
            + `${!hasStartQuote && !hasEndQuote
                ? `${quoteChars} + ${initialBindingName} + "${textAfterSelection}` : "" }`;
    }
    return {
        extractedText,
        newLine,
    };
}

export function stringQuoteDetails(text: string, quoteChar: string = `"`) {
    const hasStartQuote = text[0] === quoteChar;
    const hasEndQuote = text[text.length - 1] === quoteChar;
    const containsWholeQuotedString = text.split("").filter((c) => c === quoteChar).length === 2;
    return { hasStartQuote, hasEndQuote, containsWholeQuotedString };
}
