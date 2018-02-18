import { inlineLet } from "../extension-commands";
import {
    createSelection,
    runComparisonTest,
} from "./utils";

suite("Extension Command Tests", () => {

    // add comparison tests to array
    /* tslint:disable:object-literal-sort-keys */
    [{
        description: "should inline let binding from declaration (example 2)",
        content: `let inlineTest arg1 =
        let inlineMe = 1 + arg1
        inlineMe * 2 / (3 - inlineMe)`,
        expectedContent: `let inlineTest arg1 =
        1 + arg1 * 2 / (3 - 1 + arg1)`,
        // select inlineMe binding on line 1
        selection: createSelection(1, 12, 1, 12),
        action: inlineLet,
    },
    {
        description: "should inline let binding from usage (still example 2)",
        content: `let inlineTest arg1 =
        let inlineMe = 1 + arg1
        inlineMe * 2 / (3 - inlineMe)`,
        expectedContent: `let inlineTest arg1 =
        (1 + arg1) * 2 / (3 - (1 + arg1))`,
        // select last inlineMe on line 2
        selection: createSelection(2, 30, 2, 30),
        action: inlineLet,
    },
    {
        description: "should inline let binding from usage with binding at beginning of context (example 3)",
        content: `let inlineTest arg1 =
        let inlineMe = 1 + arg1
        let dontInline = 12345
        inlineMe * 2 / (3 - inlineMe) + dontInline`,
        expectedContent: `let inlineTest arg1 =
        let dontInline = 12345
        (1 + arg1) * 2 / (3 - (1 + arg1)) + dontInline`,
        // select inlineMe binding on line 1
        selection: createSelection(3, 30, 3, 30),
        action: inlineLet,
    }]
    .forEach(runComparisonTest);

});
