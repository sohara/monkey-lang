import { expect, test } from "bun:test";
import { BooleanObj, Integer, type Obj } from "../object/object";
import { Lexer } from "../lexer/lexer";
import { Parser } from "../parser/parser";
import { evaluate } from "./evaluator";
import { assertClass } from "../parser/parser.test";

test("evaluation of integer expressions", () => {
  const tests: [string, number][] = [
    ["5", 5],
    ["10", 10],
    ["-5", -5],
    ["-10", -10],
    ["5 + 5 + 5 + 5 - 10", 10],
    ["2 * 2 * 2 * 2 * 2", 32],
    ["-50 + 100 + -50", 0],
    ["5 * 2 + 10", 20],
    ["5 + 2 * 10", 25],
    ["20 + 2 * -10", 0],
    ["50 / 2 * 2 + 10", 60],
    ["2 * (5 + 10)", 30],
    ["3 * 3 * 3 + 10", 37],
    ["3 * (3 * 3) + 10", 37],
    ["(5 + 10 * 2 + 15 / 3) * 2 + -10", 50],
  ];

  for (const [input, expected] of tests) {
    const evaluated = testEval(input);
    testIntegerObject(evaluated, expected);
  }
});

test("evaluation of boolean expressions", () => {
  const tests: [string, boolean][] = [
    ["true", true],
    ["false", false],
    ["1 < 2", true],
    ["1 > 2", false],
    ["1 < 1", false],
    ["1 > 1", false],
    ["1 == 1", true],
    ["1 != 1", false],
    ["1 == 2", false],
    ["1 != 2", true],
    ["true == true", true],
    ["false == false", true],
    ["true == false", false],
    ["true != false", true],
    ["false != true", true],
    ["(1 < 2) == true", true],
    ["(1 < 2) == false", false],
    ["(1 > 2) == true", false],
    ["(1 > 2) == false", true],
  ];
  for (const [input, expected] of tests) {
    const evaluated = testEval(input);
    testBooleanObject(evaluated, expected);
  }
});

test("evaluation of bank operator", () => {
  const tests: [string, boolean][] = [
    ["!true", false],
    ["!false", true],
    ["!5", false],
    ["!!true", true],
    ["!!false", false],
    ["!!5", true],
  ];

  for (const [input, expected] of tests) {
    const evaluated = testEval(input);
    testBooleanObject(evaluated, expected);
  }
});

function testIntegerObject(obj: Obj | null, expected: number) {
  assertClass(obj, Integer);
  expect(obj.value).toBe(expected);
}

function testBooleanObject(obj: Obj | null, expected: boolean) {
  assertClass(obj, BooleanObj);
  expect(obj.value).toBe(expected);
}

function testEval(input: string): Obj | null {
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);
  const program = parser.parseProgram();

  return evaluate(program);
}
