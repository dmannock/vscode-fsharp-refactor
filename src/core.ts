"use strict";
import * as vscode from "vscode";

const lambdaRegexPattern = `\\(fun([^-]+)->(.+)\\)`;

export interface IMatchedBindingLine {
    indentation: string;
    binding: string;
    bindingName: string;
    expression: string;
}

export interface ISelectionDetails {
    line: number;
    range: vscode.Range;
    selection: vscode.Selection;
    text: string;
}

export const matchBindingLine = (bindingNameToMatch = "\\S+") => (text) => {
    const matched = new RegExp(`^(\\s+)(let)\\s+(${bindingNameToMatch})\\s+=\\s+([\\s\\S]+)`).exec(text);
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

export function isLambdaSelection(text: string) {
    return new RegExp(lambdaRegexPattern).test(text);
}

export function lambdaBindingFromSelection(text: string)  {
    const [, rawArgs, rawBody] = new RegExp(lambdaRegexPattern).exec(text);
    const args = rawArgs.split(" ").filter((x) => x);
    return {
        args,
        body: ensureParenthesesWrapping(rawBody).trim(),
    };
}

function lambdaToBinding(obj) {
    return `let extracted ${obj.args.join(" ")} = ${obj.body}\r\n`;
}

function ensureParenthesesWrapping(text) {
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

export function isSelectionValid(selectionDetails: ISelectionDetails) {
    if (!selectionDetails.range.isSingleLine) {
        return vscode.window.showWarningMessage("Multiple line selections are not supported");
    }
    if (selectionDetails.range.isEmpty) {
        return vscode.window.showInformationMessage("Select the expression to extract");
    }
    return true;
}

export function getExpandedSelection(sel: vscode.Selection[], doc: vscode.TextDocument): ISelectionDetails {
    const selection = sel[0];
    const wordRange = doc.getWordRangeAtPosition(new vscode.Position(sel[0].start.line, sel[0].start.character));
    const text = doc.getText(wordRange);
    return {
        line: wordRange.start.line,
        range: wordRange,
        selection,
        text,
    };
}

export function getSelectionDetails(sel: vscode.Selection[], doc: vscode.TextDocument): ISelectionDetails {
    const selection = sel[0];
    const wordRange = new vscode.Range(selection.start, selection.end);
    const text = doc.getText(wordRange);
    return {
        line: wordRange.start.line,
        range: wordRange,
        selection,
        text,
    };
}

export function getIndentation(doc: vscode.TextDocument, line: number): string {
    const matched = doc.lineAt(line).text.match(/^\s+/);
    return matched ? matched[0] : "";
}

export function wordIndexesInText(text: string, toFind: string): number[] {
    const found = [];
    let lastWordIndex = -1;
    while (true) {
        lastWordIndex = text.indexOf(toFind, lastWordIndex + 1);
        if (lastWordIndex === -1) {
            break;
        }
        found.push(lastWordIndex);
    }
    return found;
}

export function getWordInstancesBelow(doc: vscode.TextDocument, word: string,
                                      startingLine: number, indentationCharCount: number): vscode.Position[] {
    const positions = [];
    for (let i = startingLine + 1; i < doc.lineCount; i++) {
        const currentLine = doc.lineAt(i);
        if (currentLine.firstNonWhitespaceCharacterIndex < indentationCharCount) {
            break;
        }
        wordIndexesInText(currentLine.text, word)
            .map((wordIndex) => doc.getWordRangeAtPosition(new vscode.Position(i, wordIndex)))
            .forEach((position) => positions.push(position));
    }
    return positions;
}

export function getBindingDeclarationAbove(doc: vscode.TextDocument, bindingName: string,
                                           startingLine: number, indentationCharCount: number) {
    let currentLine: vscode.TextLine;
    const matchBindlineLineForName = matchBindingLine(bindingName);
    for (let i = startingLine - 1; i >= 0; i--) {
        currentLine = doc.lineAt(i);
        if (currentLine.firstNonWhitespaceCharacterIndex > currentLine.firstNonWhitespaceCharacterIndex) {
            break;
        }
        const matched = matchBindlineLineForName(currentLine.text);
        if (matched) {
            return {
                matchedLine: currentLine,
                matchedLineRegexMatch: matched,
            };
        }
    }
    return null;
}
