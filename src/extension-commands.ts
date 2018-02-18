"use strict";
import * as vscode from "vscode";
import {
    getBindingDeclarationAbove,
    getExpandedSelection,
    getIndentation,
    getSelectionDetails,
    getWordInstancesBelow,
    IMatchedBindingLine,
    ISelectionDetails,
    isLambdaSelection,
    isSelectionValid,
    lambdaBindingFromSelection,
    matchBindingLine,
} from "./core";

export async function extractLet(editor: vscode.TextEditor) {
    if (editor.selections.length > 1) {
        return vscode.window.showWarningMessage("Multiple selection are not supported");
    }
    const document = editor.document;
    const selectionDetails = getSelectionDetails(editor.selections, document);
    if (!isSelectionValid(selectionDetails)) {
        return;
    }
    const initialBindingName = "extracted";
    const indentation = getIndentation(document, selectionDetails.line);
    let extractedBinding;
    if (isLambdaSelection(selectionDetails.text)) {
        const { args, body } = lambdaBindingFromSelection(selectionDetails.text);
        extractedBinding =  `${indentation}let ${initialBindingName} ${args.join(" ")} = ${body}\r\n`;
    } else {
        extractedBinding = `${indentation}let ${initialBindingName} = ${selectionDetails.text}\r\n`;
    }
    return editor.edit((eb) => {
        eb.replace(selectionDetails.selection, initialBindingName);
        eb.insert(new vscode.Position(selectionDetails.line, 0), extractedBinding);
    });
}

export async function inlineLet(editor: vscode.TextEditor) {
    if (editor.selections.length > 1) {
        return vscode.window.showWarningMessage("Multiple selection are not supported");
    }
    const document = editor.document;
    const selectionDetails = getExpandedSelection(editor.selections, document);
    if (!isSelectionValid(selectionDetails)) {
        return;
    }
    const currentLine = document.lineAt(selectionDetails.line);
    const currentLineRegexMatch = matchBindingLine()(currentLine.text);
    if (currentLineRegexMatch) {
        await inlineAllOccurances(editor, currentLineRegexMatch, currentLine);
    } else {
        const bindingDeclaration = getBindingDeclarationAbove(document, selectionDetails.text,
            selectionDetails.line, currentLine.firstNonWhitespaceCharacterIndex);
        if (bindingDeclaration) {
            // wrapped in brackets to ensure precidence is preserved (without knowing usage context)
            await inlineAllOccurances(editor, bindingDeclaration.matchedLineRegexMatch,
                bindingDeclaration.matchedLine, true);
        }
    }
}

async function inlineAllOccurances(editor: vscode.TextEditor,
                                   matchedBindingLine: IMatchedBindingLine,
                                   currentLine: vscode.TextLine,
                                   wrapWithparentheses: boolean = false
) {
    const document = editor.document;
    const { bindingName, expression } = matchedBindingLine;
    const occurancesToReplace = getWordInstancesBelow(document, bindingName,
        currentLine.lineNumber, currentLine.firstNonWhitespaceCharacterIndex);

    return editor.edit((eb) => {
        eb.delete(currentLine.rangeIncludingLineBreak);
        for (const range of occurancesToReplace) {
            eb.replace(range, wrapWithparentheses ? `(${expression})` : expression);
        }
    });
}
