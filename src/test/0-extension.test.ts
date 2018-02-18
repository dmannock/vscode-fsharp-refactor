import * as assert from "assert";
import * as vscode from "vscode";

const extensionId = "danmannock.vscode-fsharp-refactor";

// file prefix to run these first
suite("Extension Tests", () => {

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

});
