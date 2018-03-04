"use strict";

const lambdaRegexPattern = `\\(fun([^-]+)->(.+)\\)`;

export interface IMatchedBindingLine {
    indentation: string;
    binding: string;
    bindingName: string;
    expression: string;
}

export function ensureParenthesesWrapping(text) {
    const bracketsCount = text
        .split("")
        .reduce((acc, cur) =>
            cur === "("
            ? Object.assign(acc, { open: acc.open + 1 })
            : cur === ")"
            ? Object.assign(acc, { close: acc.close + 1 })
            : acc,
        { open: 0, close: 0});
    return bracketsCount.open > bracketsCount.close
        ? text + ")"
        : bracketsCount.open < bracketsCount.close
        ? "(" + text
        : text;
}

export function isLambdaSelection(text: string) {
    return new RegExp(lambdaRegexPattern).test(text);
}

export function lambdaBindingFromSelection(text: string)  {
    const [, rawArgs, rawBody] = new RegExp(lambdaRegexPattern).exec(text);
    const args = rawArgs.split(" ").filter((x) => x);
    return {
        args,
        body: ensureParenthesesWrapping(rawBody).trim(),
    };
}

export const matchBindingLine = (bindingNameToMatch = "\\S+") => (text): IMatchedBindingLine => {
    const matched = new RegExp(`^(\\s+)(let)\\s+(${bindingNameToMatch})\\s+=\\s+([\\s\\S]+)`).exec(text);
    if (!matched) {
        return null;
    }
    const [, indentation, binding, bindingName, expression] = matched;
    return {
        binding,
        bindingName,
        expression,
        indentation,
    };
};

export function wordIndexesInText(text: string, toFind: string): number[] {
    const found = [];
    let lastWordIndex = -1;
    while (true) {
        lastWordIndex = text.indexOf(toFind, lastWordIndex + 1);
        if (lastWordIndex === -1) {
            break;
        }
        found.push(lastWordIndex);
    }
    return found;
}
