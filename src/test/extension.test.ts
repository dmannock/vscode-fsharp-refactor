import * as assert from "assert";
import * as vscode from "vscode";
import * as core from "../core";

import {
    extractLet,
    inlineLet
} from "../extension";
import {
    createSelection,
    getAllText,
    preTestSetup,
    runComparisonTest,
} from "./utils";

const extensionId = "danmannock.vscode-fsharp-refactor";

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
