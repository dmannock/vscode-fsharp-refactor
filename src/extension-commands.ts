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
    const currentLineRegexMatch = matchBindingLine()(currentLine.text);
    if (currentLineRegexMatch) {
        return await inlineAllOccurances(editor, currentLineRegexMatch, currentLine);
    } else {
        const bindingDeclaration = getBindingDeclarationAbove(document, selectionDetails.text,
            selectionDetails.line, currentLine.firstNonWhitespaceCharacterIndex);
        if (bindingDeclaration) {
            // wrapped in brackets to ensure precidence is preserved (without knowing usage context)
            return await inlineAllOccurances(editor, bindingDeclaration.matchedLineRegexMatch,
                bindingDeclaration.matchedLine, true);
        }
    }
}

async function inlineAllOccurances(editor: vscode.TextEditor,
                                   matchedBindingLine: IMatchedBindingLine,
                                   currentLine: vscode.TextLine,
                                   wrapWithparentheses: boolean = false
): Promise<boolean> {
    const document = editor.document;
    const { bindingName, expression } = matchedBindingLine;
    const occurancesToReplace = getWordInstancesBelow(document, bindingName,
        currentLine.lineNumber, currentLine.firstNonWhitespaceCharacterIndex);
    if (occurancesToReplace.length === 0) {
        vscode.window.showWarningMessage("No occurances were found to replace.");
        return false;
    }
    return editor.edit((eb) => {
        eb.delete(currentLine.rangeIncludingLineBreak);
        for (const range of occurancesToReplace) {
            eb.replace(range, wrapWithparentheses ? `(${expression})` : expression);
        }
    });
}
