'use strict';
import * as vscode from 'vscode';

type SelectionDetails = {
    text: string,
    range: vscode.Range,
    line: number,
    selection: vscode.Selection    
}

type RangeProvider = (sel: vscode.Selection) => vscode.Range

export function activate(context: vscode.ExtensionContext) {
    
    console.log("F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#");
    console.log("F# Fsharp Refactor extension active :)  F#");
    console.log("F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#");
    
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.extractLet', (editor) => {
        const { document, selections } = editor;
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
        //(*) get cursor pos
        //(*) expand to whole word
        //( ) is word @ let binding?
        //(*) -> find all instances below (within context)
        //(*)    that have the sam eindentation or more
        //( ) -> else it is one of the instances
        //( )   1) find above with let binding (naive) s could go out of context 
        //( )   2) find other instances below if any
        const { document, selections } = editor;
        if (selections.length > 1) {
            return vscode.window.showWarningMessage("Multiple selection are not supported");
        }
        const selectionDetails = getExpandedSelection(selections, document);
        if (!isSelectionValid(selectionDetails)) {
            return;
        }
        const currentLine = document.lineAt(selectionDetails.line);
        const [, indentation, binding, bindingName, expression] = currentLine.text.match(/^(\s+)(let)\s+(\S+)\s+=\s+([\s\S]+)/)
        const occurancesToReplace = getWordInstances(document, bindingName, selectionDetails.line + 1, currentLine.firstNonWhitespaceCharacterIndex)

        editor.edit(eb => {
            eb.delete(currentLine.rangeIncludingLineBreak);
            for (const range of occurancesToReplace) {
                eb.replace(range, expression);
            }
        });

    }));

    function isSelectionValid(selectionDetails: SelectionDetails) {
        if (!selectionDetails.range.isSingleLine) {
            return vscode.window.showWarningMessage("Multiple line selections are not supported");
        }
        if (selectionDetails.range.isEmpty) {
            return vscode.window.showInformationMessage("Select the expression to extract");
        }
        return true;
    }
    
    function getExpandedSelection(sel: vscode.Selection[], doc: vscode.TextDocument): SelectionDetails {
        const selection = sel[0];
        const wordRange = doc.getWordRangeAtPosition(new vscode.Position(sel[0].start.line, sel[0].start.character))
        const text = doc.getText(wordRange);
        return {
            text: text,
            range: wordRange,
            line: wordRange.start.line,
            selection: selection
        }
    }

    function getSelectionDetails(sel: vscode.Selection[], doc: vscode.TextDocument): SelectionDetails {
        const selection = sel[0];
        const wordRange = new vscode.Range(selection.start, selection.end);
        const text = doc.getText(wordRange);
        return {
            text: text,
            range: wordRange,
            line: wordRange.start.line,
            selection: selection
        }
    }

    function getIndentation(doc: vscode.TextDocument, line: number): string {
        return doc.lineAt(line).text.match(/^\s+/)[0];
    }

    function wordIndexesInText(text: string, toFind: string): number[] {
        const found = [];
        let lastWordIndex = -1;
        while (true) {
            lastWordIndex = text.indexOf(toFind, lastWordIndex + 1);
            if (lastWordIndex == -1) {
                break;
            }
            found.push(lastWordIndex);
        }
        return found;
    }

    function getWordInstances(doc: vscode.TextDocument, word: string, startingLine: number, indentationCharCount: number): vscode.Position[] {
        const positions = [];
        for (let i = startingLine; i < doc.lineCount; i++) {
            const currentLine = doc.lineAt(i);
            if (currentLine.firstNonWhitespaceCharacterIndex < indentationCharCount) {
                break;
            }
            wordIndexesInText(currentLine.text, word)
                .map(wordIndex => doc.getWordRangeAtPosition(new vscode.Position(i, wordIndex)))
                .forEach(position => positions.push(position));
        }
        return positions;
    }
}

export function deactivate() {
}