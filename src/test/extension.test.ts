import * as assert from "assert";
import * as vscode from "vscode";
import * as core from "../core";

import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { extractLet } from "../extension";

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

    const preTestSetup = async (fileContent: string) => {
        const file = await createTestFile(fileContent);
        const document = await vscode.workspace.openTextDocument(file);
        await vscode.window.showTextDocument(document);
        return vscode.window.activeTextEditor;
    };

    const getAllText = async (document: vscode.TextDocument) => document.getText(new vscode.Range(
        new vscode.Position(0, 0),
        new vscode.Position(document.lineCount, Infinity))
    );

    const createTestFile = async (content: string) => new Promise((resolve, reject) => {
        const tmpFile = path.join(os.tmpdir(), randomName());
        return fs.writeFile(
            tmpFile,
            content,
            (err) => err
                ? reject(err)
                : resolve(vscode.Uri.file(tmpFile))
        );
    });

    const randomName = () => Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, "")
        .substr(0, 10);
});
