"use strict";
import * as vscode from "vscode";
import {
    createBindingLineRegex,
    ISelectionDetails,
    getBindingDeclarationAbove,
    getExpandedSelection,
    getIndentation,
    getSelectionDetails,
    getWordInstancesBelow,
    isSelectionValid,
} from "./core";

export function activate(context: vscode.ExtensionContext) {

    /* tslint:disable:no-console */
    console.log("F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#");
    console.log("F# Fsharp Refactor extension active :)  F#");
    console.log("F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#");
    /* tslint:enable:no-console */

    context.subscriptions.push(vscode.commands.registerTextEditorCommand("fsharp-refactor.extractLet",
        async (editor) => {
            const { document, selections } = editor;
            if (document.languageId !== "fsharp") {
                return;
            }
            if (selections.length > 1) {
                return vscode.window.showWarningMessage("Multiple selection are not supported");
            }
            await extractLet(editor);
            vscode.commands.executeCommand("editor.action.rename");
        }
    ));

    context.subscriptions.push(vscode.commands.registerTextEditorCommand("fsharp-refactor.inlineLet",
        async (editor) => {
            const { document, selections } = editor;
            if (document.languageId !== "fsharp") {
                return;
            }
            if (selections.length > 1) {
                return vscode.window.showWarningMessage("Multiple selection are not supported");
            }
            await inlineLet(editor);
        }
    ));
}

export async function extractLet(editor: vscode.TextEditor) {
    const document = editor.document;
    const selectionDetails = getSelectionDetails(editor.selections, document);
    if (!isSelectionValid(selectionDetails)) {
        return;
    }
    const initialBindingName = "extracted";
    const indentation = getIndentation(document, selectionDetails.line);
    return editor.edit((eb) => {
        eb.replace(selectionDetails.selection, initialBindingName);
        eb.insert(new vscode.Position(selectionDetails.line, 0),
            `${indentation}let ${initialBindingName} = ${selectionDetails.text}\r\n`);
    });
}

// TODO: refactor after tests! (such nesting, many brackets, uggh!)
export async function inlineLet(editor: vscode.TextEditor) {
    const document = editor.document;
    const selectionDetails = getExpandedSelection(editor.selections, document);
    if (!isSelectionValid(selectionDetails)) {
        return;
    }
    const currentLine = document.lineAt(selectionDetails.line);
    const matchedBindingLine = createBindingLineRegex().exec(currentLine.text);
    if (matchedBindingLine) {
        await inlineAllOccurances(matchedBindingLine, selectionDetails, currentLine, editor);
    } else {
        // naive initial concept
        const selectedBindingName = selectionDetails.text;
        const matchedBindingLineAbove = getBindingDeclarationAbove(document,
            selectedBindingName,
            selectionDetails.line,
            currentLine.firstNonWhitespaceCharacterIndex
        );

        if (matchedBindingLineAbove) {
            // wrapped in brackets to ensure precidence is preserved (without knowing usage context)
            await inlineAllOccurances(matchedBindingLineAbove.matchedBindingLine, 
                selectionDetails, 
                matchedBindingLineAbove.matchedLine, 
                editor, 
                (replace) => `(${replace})`
            );
        }
    }
}

async function inlineAllOccurances(matchedBindingLine: RegExpExecArray, 
                            selectionDetails: ISelectionDetails, 
                            currentLine: vscode.TextLine, 
                            editor: vscode.TextEditor, 
                            replaceTransform: ((text: string) => string) = null
) {
    const document = editor.document;
    const [, indentation, binding, bindingName, expression] = matchedBindingLine;
    const occurancesToReplace = getWordInstancesBelow(document, bindingName, 
        currentLine.lineNumber, 
        currentLine.firstNonWhitespaceCharacterIndex
    );
    return editor.edit((eb) => {
        eb.delete(currentLine.rangeIncludingLineBreak);
        for (const range of occurancesToReplace) {
            eb.replace(range, replaceTransform ? replaceTransform(expression) : expression);
        }
    });
}

