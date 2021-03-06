"use strict";
import * as vscode from "vscode";
import {
    getExtractedString,
    IMatchedBindingLine,
    isLambdaSelection,
    isStringSelection,
    lambdaBindingFromSelection,
    matchBindingLine,
} from "./general-funcs";

import {
    getBindingDeclarationAbove,
    getExpandedSelection,
    getIndentation,
    getSelectionDetails,
    getWordInstancesBelow,
    ISelectionDetails,
    isSelectionValid,
} from "./vscode-funcs";

const initialBindingName = "extracted";

export async function extractLet(editor: vscode.TextEditor): Promise<boolean> {
    if (editor.selections.length > 1) {
        vscode.window.showWarningMessage("Multiple selection are not supported");
        return false;
    }
    const document = editor.document;
    const selectionDetails = getSelectionDetails(editor.selections, document);
    if (!isSelectionValid(selectionDetails)) {
        return false;
    }
    const indentation = getIndentation(document, selectionDetails.line);
    const textLine = document.lineAt(selectionDetails.line).text;
    let extractedBinding;
    if (isLambdaSelection(selectionDetails.text)) {
        const { args, body } = lambdaBindingFromSelection(selectionDetails.text);
        extractedBinding =  `${indentation}let ${initialBindingName} ${args.join(" ")} = ${body}\r\n`;
    } else if (isStringSelection(selectionDetails.text, textLine)) {
        const { start, end } = selectionDetails.selection;
        const { extractedText, newLine } = getExtractedString(textLine, start.character, end.character);
        extractedBinding = `${indentation}let ${initialBindingName} = ${extractedText}\r\n`;
        return editor.edit((eb) => {
            eb.replace(new vscode.Range(
                new vscode.Position(selectionDetails.line, 0),
                new vscode.Position(selectionDetails.line, textLine.length)
            ), newLine);
            eb.insert(new vscode.Position(selectionDetails.line, 0), extractedBinding);
        });
    } else {
        extractedBinding = `${indentation}let ${initialBindingName} = ${selectionDetails.text}\r\n`;
    }
    return editor.edit((eb) => {
        eb.replace(selectionDetails.selection, initialBindingName);
        eb.insert(new vscode.Position(selectionDetails.line, 0), extractedBinding);
    });
}

export async function inlineLet(editor: vscode.TextEditor): Promise<boolean> {
    if (editor.selections.length > 1) {
        vscode.window.showWarningMessage("Multiple selection are not supported");
        return false;
    }
    const document = editor.document;
    const selectionDetails = getExpandedSelection(editor.selections, document);
    if (!isSelectionValid(selectionDetails)) {
        return false;
    }
    const currentLine = document.lineAt(selectionDetails.line);
    const currentLineRegexMatch = matchBindingLine(selectionDetails.text)(currentLine.text);
    if (currentLineRegexMatch) {
        return await inlineAllOccurrences(editor, currentLineRegexMatch, currentLine);
    } else {
        const bindingDeclaration = getBindingDeclarationAbove(document, selectionDetails.text,
            selectionDetails.line, currentLine.firstNonWhitespaceCharacterIndex);
        if (bindingDeclaration) {
            return await inlineAllOccurrences(editor, bindingDeclaration.matchedLineRegexMatch,
                bindingDeclaration.matchedLine);
        }
    }
}

async function inlineAllOccurrences(editor: vscode.TextEditor,
                                    matchedBindingLine: IMatchedBindingLine,
                                    currentLine: vscode.TextLine
): Promise<boolean> {
    const document = editor.document;
    const { bindingName, expression, requiresParens } = matchedBindingLine;
    const occurrencesToReplace = getWordInstancesBelow(document, bindingName,
        currentLine.lineNumber, currentLine.firstNonWhitespaceCharacterIndex);
    if (occurrencesToReplace.length === 0) {
        vscode.window.showWarningMessage("No occurrences were found to replace.");
        return false;
    }
    return editor.edit((eb) => {
        eb.delete(currentLine.rangeIncludingLineBreak);
        for (const range of occurrencesToReplace) {
            eb.replace(range, requiresParens ? `(${expression})` : expression);
        }
    });
}
