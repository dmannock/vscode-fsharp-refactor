import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";

export const preTestSetup = async (fileContent: string) => {
    const file = await createTestFile(fileContent);
    const document = await vscode.workspace.openTextDocument(file);
    await vscode.window.showTextDocument(document);
    return vscode.window.activeTextEditor;
};

export const getAllText = async (document: vscode.TextDocument) => document.getText(new vscode.Range(
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
