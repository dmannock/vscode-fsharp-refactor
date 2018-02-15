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

suite("Extension Command Tests", () => {

    // add comparison tests to array
    /* tslint:disable:object-literal-sort-keys */
    [{
        description: "should extract let binding (example 1)",
        content: `let test arg1 =
        let added = 1 + arg1
        let multi = added * 10 * arg1
        multi / 2`,
        expectedContent: `let test arg1 =
        let added = 1 + arg1
        let extracted = 10 * arg1
        let multi = added * extracted
        multi / 2`,
        // select '10 * arg1'
        selection: createSelection(2, 28, 2, 37),
        action: extractLet,
    },
    {
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
    },
    {
        description: "should extract unary function to let binding (example 4)",
        content: `let extractLet chars =
        let noSpaces = chars |> Array.filter ((<>) ' ')
        noSpaces`,
        expectedContent: `let extractLet chars =
        let extracted = ((<>) ' ')
        let noSpaces = chars |> Array.filter extracted
        noSpaces`,
        // select i((<>) ' ') on line 1
        selection: createSelection(1, 45, 1, 55),
        action: extractLet,
    },
    {
        description: "should extract parameterised function to let binding (example 5)",
        content: `let extractLambda o =
        let res = (o |> Array.fold (fun acc n -> (n |> Array.toList) @ acc ) []).Head
        res`,
        expectedContent: `let extractLambda o =
        let extracted acc n = (n |> Array.toList) @ acc
        let res = (o |> Array.fold extracted []).Head
        res`,
        // select (fun acc n -> (n |> Array.toList) @ acc ) on line 1
        selection: createSelection(1, 35, 1, 76),
        action: extractLet,
    }]
    .forEach(runComparisonTest);

});
