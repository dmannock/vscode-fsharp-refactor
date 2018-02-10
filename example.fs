
//[*] example 1 ////////////////////////////////////////
let test arg1 =
    let added = 1 + arg1
    let multi = added * 10
    multi / 2
    
//[*] example 2 ////////////////////////////////////////
let inlineTest arg1 =
    let inlineMe = 1 + arg1
    inlineMe * 2 / (3 - inlineMe)

//some use case examples from https://github.com/ionide/ionide-vscode-fsharp/issues/172

//[*] example 3 ////////////////////////////////////////
let extractLet chars =
    let noSpaces = chars |> Array.filter ((<>) ' ')
    noSpaces

//[ ] example 4 ////////////////////////////////////////
let extractLambda o =
    let res = (o |> Array.fold (fun acc n -> (n |> Array.toList) @ acc ) []).Head
    res
//should refactor to:
// let collectSignatures acc n = 
//     (n |> Array.toList) @ acc 
// let res = (o |> Array.fold collectSignatures []).Head

//[ ] example 5 ////////////////////////////////////////
let bashPath = "/usr/bin/bash"
let zshPath = "/usr/bin/zsh"

//should refactor to:
// let prefix = "/usr/bin/"
// let bashPath = prefix + "bash"
// let zshPath = prefix + "zsh"