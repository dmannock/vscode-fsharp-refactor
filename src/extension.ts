'use strict';
import * as vscode from 'vscode';
import { 
    bindingLineRegex,
    getSelectionDetails, 
    isSelectionValid,
    getIndentation, 
    getExpandedSelection,
    getBindingDeclarationAbove,
    getWordInstancesBelow } from './core'

export function activate(context: vscode.ExtensionContext) {

    console.log("F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#");
    console.log("F# Fsharp Refactor extension active :)  F#");
    console.log("F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#");
    
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.extractLet', (editor) => {
        const { document, selections } = editor;
        if (document.languageId != "fsharp") {
            return;
        }
        if (selections.length > 1) {
            return vscode.window.showWarningMessage("Multiple selection are not supported");
        }
        const selectionDetails = getSelectionDetails(selections, document);
        if (!isSelectionValid(selectionDetails)) {
            return;
        }
        const initialBindingName = "extracted";
        const indentation = getIndentation(document, selectionDetails.line);
        editor.edit(eb => {
            eb.replace(selectionDetails.selection, initialBindingName);
            eb.insert(new vscode.Position(selectionDetails.line, 0), 
            `${indentation}let ${initialBindingName} = ${selectionDetails.text}\r\n`);
        });
        vscode.commands.executeCommand("editor.action.rename")
    }));
    
    context.subscriptions.push(vscode.commands.registerTextEditorCommand("extension.inlineLet", (editor) => {
        //TODO: refactor!
        const { document, selections } = editor;
        if (document.languageId != "fsharp") {
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
        const matchedBindingLine = currentLine.text.match(bindingLineRegex)
        if (matchedBindingLine) {
            const [, indentation, binding, bindingName, expression] = matchedBindingLine;
            const occurancesToReplace = getWordInstancesBelow(document, bindingName, selectionDetails.line + 1, currentLine.firstNonWhitespaceCharacterIndex);
            editor.edit(eb => {
                eb.delete(currentLine.rangeIncludingLineBreak);
                for (const range of occurancesToReplace) {
                    eb.replace(range, expression);
                }
            });
        } else {
            //naive initial concept
            const matchedBindingLine = getBindingDeclarationAbove(document, selectionDetails.text, selectionDetails.line - 1, currentLine.firstNonWhitespaceCharacterIndex);
            if (matchedBindingLine) {
                const [, indentation, binding, bindingName, expression] = matchedBindingLine.matchedBindingLine;
                const occurancesToReplace = getWordInstancesBelow(document, bindingName, matchedBindingLine.matchedLine.lineNumber + 1, matchedBindingLine.matchedLine.firstNonWhitespaceCharacterIndex);
                editor.edit(eb => {
                    eb.delete(matchedBindingLine.matchedLine.rangeIncludingLineBreak);
                    for (const range of occurancesToReplace) {
                        //wrapped in brackets to ensure precidence is preserved (without knowing usage context)
                        eb.replace(range, `(${expression})`);
                    }
                });        
            }
        }

    }));
}

export function deactivate() {
}