import * as assert from "assert";
import * as vscode from "vscode";
import * as core from "../core";

import {
    extractLet,
    inlineLet
} from "../extension";
import {
    getAllText,
    preTestSetup
} from "./utils";

const extensionId = "danmannock.vscode-fsharp-refactor";

suite("Extension Tests", () => {
// TODO:
    test("should have loaded extension", () => {
        assert.ok(vscode.extensions.getExtension(extensionId));
    });

    test("should have activated extension", (done) => {
        const extension = vscode.extensions.getExtension(extensionId);
        if (!extension.isActive) {
            extension.activate().then(
                () => done(),
                () => done("Activation failed."));
            return;
        }
        done();
    });

    test("should extract let binding (example 1)", async () => {
        const content = `let test arg1 =
        let added = 1 + arg1
        let multi = added * 10 * arg1
        multi / 2`;

        const expectedContent = `let test arg1 =
        let added = 1 + arg1
        let extracted = 10 * arg1
        let multi = added * extracted
        multi / 2`;

        const editor = await preTestSetup(content);
        // select '10 * arg1'
        editor.selection = new vscode.Selection(
            new vscode.Position(2, 28),
            new vscode.Position(2, 37)
        );

        await extractLet(editor);

        const actualText = await getAllText(editor.document);
        assert.equal(actualText, expectedContent);
    });

    test("should inline let binding from declaration (example 2)", async () => {
        const content = `let inlineTest arg1 =
        let inlineMe = 1 + arg1
        inlineMe * 2 / (3 - inlineMe)`;

        const expectedContent = `let inlineTest arg1 =
        1 + arg1 * 2 / (3 - 1 + arg1)`;

        const editor = await preTestSetup(content);
        // select inlineMe binding on line 1
        editor.selection = new vscode.Selection(
            new vscode.Position(1, 12),
            new vscode.Position(1, 12)
        );

        await inlineLet(editor);

        const actualText = await getAllText(editor.document);
        assert.equal(actualText, expectedContent);
    });

    test("should inline let binding from usage (still example 2)", async () => {
        const content = `let inlineTest arg1 =
        let inlineMe = 1 + arg1
        inlineMe * 2 / (3 - inlineMe)`;

        // note the brackets
        const expectedContent = `let inlineTest arg1 =
        (1 + arg1) * 2 / (3 - (1 + arg1))`;

        const editor = await preTestSetup(content);
        // select last inlineMe on line 2
        editor.selection = new vscode.Selection(
            new vscode.Position(2, 30),
            new vscode.Position(2, 30)
        );

        await inlineLet(editor);

        const actualText = await getAllText(editor.document);
        assert.equal(actualText, expectedContent);
    });

    test("should inline let binding from usage with binding at beginning of context (example 3)", async () => {
        const content = `let inlineTest arg1 =
        let inlineMe = 1 + arg1
        let dontInline = 12345
        inlineMe * 2 / (3 - inlineMe) + dontInline`;

        const expectedContent = `let inlineTest arg1 =
        let dontInline = 12345
        (1 + arg1) * 2 / (3 - (1 + arg1)) + dontInline`;

        const editor = await preTestSetup(content);
        // select inlineMe binding on line 1
        editor.selection = new vscode.Selection(
            new vscode.Position(3, 30),
            new vscode.Position(3, 30)
        );

        await inlineLet(editor);

        const actualText = await getAllText(editor.document);
        assert.equal(actualText, expectedContent);
    });

    test("should extract unary function to let binding (example 4)", async () => {
        const content = `let extractLet chars =
        let noSpaces = chars |> Array.filter ((<>) ' ')
        noSpaces`;

        const expectedContent = `let extractLet chars =
        let extracted = ((<>) ' ')
        let noSpaces = chars |> Array.filter extracted
        noSpaces`;

        const editor = await preTestSetup(content);
        // select i((<>) ' ') on line 1
        editor.selection = new vscode.Selection(
            new vscode.Position(1, 45),
            new vscode.Position(1, 55)
        );

        await extractLet(editor);

        const actualText = await getAllText(editor.document);
        assert.equal(actualText, expectedContent);
    });


});
