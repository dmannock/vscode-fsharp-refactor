"use strict";
import * as vscode from "vscode";
import {
    bindingLineRegex,
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

    context.subscriptions.push(vscode.commands.registerTextEditorCommand("fsharp-refactor.inlineLet", (editor) => {
        // TODO: refactor! (such nesting, many brackets, uggh!)
        const { document, selections } = editor;
        if (document.languageId !== "fsharp") {
            return;
        }
        if (selections.length > 1) {
            return vscode.window.showWarningMessage("Multiple selection are not supported");
        }
        const selectionDetails = getExpandedSelection(selections, document);
        if (!isSelectionValid(selectionDetails)) {
            return;
        }
        const currentLine = document.lineAt(selectionDetails.line);
        const matchedBindingLine = currentLine.text.match(bindingLineRegex);
        if (matchedBindingLine) {
            const [, indentation, binding, bindingName, expression] = matchedBindingLine;
            const occurancesToReplace = getWordInstancesBelow(
                document,
                bindingName,
                selectionDetails.line + 1,
                currentLine.firstNonWhitespaceCharacterIndex);

            editor.edit((eb) => {
                eb.delete(currentLine.rangeIncludingLineBreak);
                for (const range of occurancesToReplace) {
                    eb.replace(range, expression);
                }
            });
        } else {
            // naive initial concept
            const matchedBindingLineAbove = getBindingDeclarationAbove(document,
                selectionDetails.text,
                selectionDetails.line - 1,
                currentLine.firstNonWhitespaceCharacterIndex);

            if (matchedBindingLineAbove) {
                const [, indentation, binding, bindingName, expression] = matchedBindingLineAbove.matchedBindingLine;
                const occurancesToReplace = getWordInstancesBelow(document,
                    bindingName,
                    matchedBindingLineAbove.matchedLine.lineNumber + 1,
                    matchedBindingLineAbove.matchedLine.firstNonWhitespaceCharacterIndex);

                editor.edit((eb) => {
                    eb.delete(matchedBindingLineAbove.matchedLine.rangeIncludingLineBreak);
                    for (const range of occurancesToReplace) {
                        // wrapped in brackets to ensure precidence is preserved (without knowing usage context)
                        eb.replace(range, `(${expression})`);
                    }
                });
            }
        }

    }));
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
