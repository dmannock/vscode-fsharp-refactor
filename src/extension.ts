'use strict';
import * as vscode from 'vscode';

type SelectionDetails = {
    text: string,
    range: vscode.Range,
    line: number,
    selection: vscode.Selection    
}

export function activate(context: vscode.ExtensionContext) {
    
    console.log("F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#");
    console.log("F# Fsharp Refactor extension active :)  F#");
    console.log("F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#");

    const disposable = vscode.commands.registerCommand('extension.extractLet', () => {

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return vscode.window.showInformationMessage('Open a file first to manipulate text selections');
        }
        const doc = editor.document;
        const sel = editor.selections;
        if (sel.length > 1) {
            return vscode.window.showWarningMessage("Multiple selection are not supported");
        }
        const selectionDetails = getSelection(sel, doc);
        if (!selectionDetails.range.isSingleLine) {
            return vscode.window.showWarningMessage("Multiple line selections are not supported");
        }
        const bindingName = "extracted";
        const indentation = getIndentation(doc, selectionDetails.line);
        editor.edit(eb => {
            eb.replace(selectionDetails.selection, bindingName);
            eb.insert(new vscode.Position(selectionDetails.line, 0), 
                `${indentation}let ${bindingName} = ${selectionDetails.text}\r\n`);
            });
        vscode.commands.executeCommand("editor.action.rename").then(res => console.log("rename"))
        
    });
    
    context.subscriptions.push(disposable);
    
    function getSelection(sel: vscode.Selection[], doc: vscode.TextDocument): SelectionDetails {
        //limit to one selection for initial POC
        // for (let i = 0; i < sel.length; i++) {
            const i = 0;
            const selection = sel[i];
            const range = new vscode.Range(selection.start, sel[i].end);
            const text = doc.getText(range);
            return {
                text: text,
                range: range,
                line: range.start.line,
                selection: selection
            }
        // }
    }

    function getIndentation(doc: vscode.TextDocument, line: number): string {
        return doc.lineAt(line).text.match(/^\s+/)[0];
    }
}

export function deactivate() {
}