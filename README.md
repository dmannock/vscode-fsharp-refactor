# Vscode-Fsharp-Refactor
Additional F# refactoring tools for vscode. 
Less keystrokes, more F#, more fun(ctional programming).

## Features
### Extract
Extract expression to let binding
1. Select the expression to extract
2. Use command (ctrl+shift+R)

#### Extracts expressions

![4-example-extractLet_expression](https://raw.githubusercontent.com/dmannock/vscode-fsharp-refactor/master/docs/4-example-extractLet_expression.gif)

#### Extracts lambdas
![5-example-extractLet_lambda](https://raw.githubusercontent.com/dmannock/vscode-fsharp-refactor/master/docs/5-example-extractLet_lambda.gif)

#### Extracts strings
![6-example-extractLet_string](https://raw.githubusercontent.com/dmannock/vscode-fsharp-refactor/master/docs/6-example-extractLet_string.gif)

### Inline
Inline binding 
1. Move cursor to binding or a usage
2. Use command (ctrl+shift+I)

![2-example-inlineLet](https://raw.githubusercontent.com/dmannock/vscode-fsharp-refactor/master/docs/2-example-inlineLet.gif)

Note: you can customise the hotkeys (file > preference > keyboard shortcuts)

## Requirements
If you are here you probably have this covered.
* Vscode
* Ionide

## Roadmap
who knows (see todos.txt for now)

## Building & Useful

### Full Build
Runs the full build process including:
* linting
* unit tests
* vscode tests
* extension artifacts

``
npm run build
``
### Test Watcher
Runs unit tests when changes are detected.

``
npm run unittest:watch
``
