"use strict";
import * as vscode from "vscode";
import {
    createBindingLineRegex,
    getBindingDeclarationAbove,
    getExpandedSelection,
    getIndentation,
    getSelectionDetails,
    getWordInstancesBelow,
    ISelectionDetails,
    isLambdaSelection,
    isSelectionValid,
    lambdaBindingFromSelection,
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
    let extractedBinding;
    if (isLambdaSelection(selectionDetails.text)) {
        const obj = lambdaBindingFromSelection(selectionDetails.text);
        extractedBinding =  `${indentation}let ${initialBindingName} ${obj.args.join(" ")} = ${obj.body}\r\n`;
    } else {
        extractedBinding = `${indentation}let ${initialBindingName} = ${selectionDetails.text}\r\n`;
    }
    return editor.edit((eb) => {
        eb.replace(selectionDetails.selection, initialBindingName);
        eb.insert(new vscode.Position(selectionDetails.line, 0), extractedBinding);
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
    const currentLineRegexMatch = createBindingLineRegex().exec(currentLine.text);
    if (currentLineRegexMatch) {
        await inlineAllOccurances(editor, currentLineRegexMatch, currentLine);
    } else {
        // naive initial concept
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
                                   matchedBindingLine: RegExpExecArray,
                                   currentLine: vscode.TextLine,
                                   wrapWithparentheses: boolean = false
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
            eb.replace(range, wrapWithparentheses ? `(${expression})` : expression);
        }
    });
}
