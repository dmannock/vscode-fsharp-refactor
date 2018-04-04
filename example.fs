
//[*] example 1 ////////////////////////////////////////
let test arg1 =
    let added = 1 + arg1
    let multi = added * 10
    multi / 2
    
//[*] example 2 ////////////////////////////////////////
let inlineTest arg1 =
    let inlineMe = 1 + arg1
    inlineMe * 2 / (3 - inlineMe)

//[*] example 3 ////////////////////////////////////////
let anotherInlineTest arg1 =
        let inlineMe = 1 + arg1
        let dontInline = 12345
        inlineMe * 2 / (3 - inlineMe) + dontInline

//some use case examples from https://github.com/ionide/ionide-vscode-fsharp/issues/172

//[*] example 4 ////////////////////////////////////////
let extractLet chars =
    let noSpaces = chars |> Array.filter ((<>) ' ')
    noSpaces

//[*] example 5 ////////////////////////////////////////
let extractLambda o =
    let res = (o |> Array.fold (fun acc n -> (n |> Array.toList) @ acc ) []).Head
    res
//should refactor to:
// let collectSignatures acc n = 
//     (n |> Array.toList) @ acc 
// let res = (o |> Array.fold collectSignatures []).Head

//[x] example 6 ////////////////////////////////////////
let stringToExtract = "/usr/bin/bash"

//should refactor to:
// let prefix = "/usr/bin/"
// let stringToExtract = prefix + "bash"

//[] example 7 ////////////////////////////////////////
let bashPath = "/usr/bin/bash"
let zshPath = "/usr/bin/zsh"

//should refactor to:
// let prefix = "/usr/bin/"
// let bashPath = prefix + "bash"
// let zshPath = prefix + "zsh"

//[x] example 8  ////////////////////////////////////////
let inlineTestSimilarName arg1 =
        let inlineMe = 1 + arg1
        let inlineMeWithSimilarName = inlineMe * 2 / (3 - inlineMe)
        inlineMeWithSimilarName

//[x] example 9  ////////////////////////////////////////
let inlineTestSimilarName2 arg1 =
        let inlineMe = 1 + arg1
        let inlineMeWithSimilarName = inlineMe * 2 / (3 - inlineMe)
        inlineMeWithSimilarName