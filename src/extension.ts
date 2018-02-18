"use strict";
import * as vscode from "vscode";
import {
    extractLet,
    inlineLet
} from "./extension-commands";

export function activate(context: vscode.ExtensionContext) {
    registerWithAutoDisposal("fsharp-refactor.extractLet", async (editor) => {
            await extractLet(editor);
            vscode.commands.executeCommand("editor.action.rename");
        }
    );

    registerWithAutoDisposal("fsharp-refactor.inlineLet", inlineLet);

    function registerWithAutoDisposal(command, handler) {
        context.subscriptions.push(vscode.commands.registerTextEditorCommand(command, handler));
    }

    /* tslint:disable:no-console */
    console.log("F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#");
    console.log("F# Fsharp Refactor extension active :)  F#");
    console.log("F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#F#");
    /* tslint:enable:no-console */
}
