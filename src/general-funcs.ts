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
    const matched = new RegExp(`^(\\s+)(let)\\s+\\b(${bindingNameToMatch})\\b\\s+=\\s+([\\s\\S]+)`).exec(text);
    if (!matched) {
        return null;
    }
    const [, indentation, binding, bindingName, expression] = matched;
    return {
        binding,
        bindingName,
        expression,
        indentation,
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
    } while (true)
}

export function getExtractedString(textLine: string, selectionStartPos: number, selectionEndPos: number) {
    const initialBindingName = "extracted";
    const quoteChars = `"`;
    const selectedText = textLine.substring(selectionStartPos, selectionEndPos);

    const isStartSelected = selectedText[0] === quoteChars;
    const isEndSelected = selectedText[selectedText.length - 1] === quoteChars;

    const textBeforeSelection = textLine.substring(0, selectionStartPos);
    const mid = textLine.substring(selectionStartPos, selectionStartPos);
    const textAfterSelection = textLine.substring(selectionEndPos, Infinity);

    const extractedText = `${!isStartSelected ? `"` : ""}${selectedText}${!isEndSelected ? `"` : ""}`;
    const newLine = `${textBeforeSelection}`
        + `${isStartSelected && !isEndSelected
            ? `${initialBindingName} + ${quoteChars}${textAfterSelection}` : ""}`
        + `${isEndSelected && !isStartSelected
            ? `${mid}${quoteChars} + ${initialBindingName}` : ""}`
        + `${!isStartSelected && !isEndSelected
            ? `${quoteChars} + ${initialBindingName} + "${textAfterSelection}` : "" }`;
    return {
        extractedText,
        newLine,
    };
}
