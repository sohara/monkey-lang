import { expect, test } from "bun:test";
import {
  BooleanObj,
  Environment,
  ErrorObj,
  Integer,
  StringObj,
  type Obj,
} from "../object/object";
import { Lexer } from "../lexer/lexer";
import { Parser } from "../parser/parser";
import { NULL, evaluate } from "./evaluator";
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

test("evaluation of string literal", () => {
  const input = `"Hello World!"`;
  const evaluated = testEval(input);
  assertClass(evaluated, StringObj);
  expect(evaluated.value).toBe("Hello World!");
});

test("evaluation of bang operator", () => {
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

test("evaluation of if/else expressions", () => {
  const tests: [string, number | null][] = [
    ["if (true) { 10 }", 10],
    ["if (false) { 10 }", null],
    ["if (1) { 10 }", 10],
    ["if (1 < 2) { 10 }", 10],
    ["if (1 > 2) { 10 }", null],
    ["if (1 > 2) { 10 } else { 20 }", 20],
    ["if (1 < 2) { 10 } else { 20 }", 10],
  ];

  for (const [input, expected] of tests) {
    const evaluated = testEval(input);
    if (typeof expected === "number") {
      testIntegerObject(evaluated, expected);
    } else {
      testNullObject(evaluated);
    }
  }
});

test("evaluation of return statements", () => {
  const tests: [string, number][] = [
    ["return 10;", 10],
    ["return 10; 9;", 10],
    ["return 2 * 5; 9;", 10],
    ["9; return 2 * 5; 9;", 10],
    [
      `
		    if (10 > 1) {
		      if (10 > 1) {
		        return 10;
		      }
		      return 1;
		    }
		    `,
      10,
    ],
  ];
  for (const [input, expected] of tests) {
    const evaluated = testEval(input);
    testIntegerObject(evaluated, expected);
  }
});

test("error handling", () => {
  const tests: [string, string][] = [
    ["5 + true;", "type mismatch: INTEGER + BOOLEAN"],
    ["5 + true; 5;", "type mismatch: INTEGER + BOOLEAN"],
    ["-true", "unknown operation: -BOOLEAN"],
    ["true + false;", "unknown operator: BOOLEAN + BOOLEAN"],
    ["5; true + false; 5", "unknown operator: BOOLEAN + BOOLEAN"],
    ["if (10 > 1) { true + false; }", "unknown operator: BOOLEAN + BOOLEAN"],
    [
      `
		if (10 > 1) {
		  if (10 > 1) {
		    return true + false;
		  }
		  return 1;
		}
		`,
      "unknown operator: BOOLEAN + BOOLEAN",
    ],
    ["foobar", "identifier not found: foobar"],
  ];

  for (const [input, expectedMessage] of tests) {
    const evaluated = testEval(input);
    assertClass(evaluated, ErrorObj);

    expect(evaluated.message).toBe(expectedMessage);
  }
});

test("`let` statements", () => {
  const tests: [string, number][] = [
    ["let a = 5; a;", 5],
    ["let a = 5 * 5; a;", 25],
    ["let a = 5; let b = a; b;", 5],
    ["let a = 5; let b = a; let c = a + b + 5; c;", 15],
  ];

  for (const [input, expected] of tests) {
    testIntegerObject(testEval(input), expected);
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
  const env = new Environment();

  return evaluate(program, env);
}

function testNullObject(obj: Obj | null) {
  expect(obj).toBe(NULL);
}
