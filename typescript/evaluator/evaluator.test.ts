import { expect, test } from "bun:test";
import {
  BooleanObj,
  ErrorObj,
  Integer,
  StringObj,
  type Obj,
  FunctionObj,
  ArrayObj,
  Hash,
  type HashKey,
  HashPair,
} from "../object/object";
import { Lexer } from "../lexer/lexer";
import { Parser } from "../parser/parser";
import { FALSE, NULL, TRUE, evaluate } from "./evaluator";
import { assertClass } from "../parser/parser.test";
import { Environment } from "../object/environment";

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

test("string concatenatio", () => {
  const input = `"Hello" + " " + "World!"`;
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
    ["if (10 > 1) { return 10; }", 10],
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
    [
      `
let f = fn(x) {
  return x;
  x + 10;
};
f(10);`,
      10,
    ],
    [
      `
let f = fn(x) {
   let result = x + 10;
   return result;
   return 10;
};
f(10);`,
      20,
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
    [`"Hello" - "World"`, "unknown operator: STRING - STRING"],
    [`{"name": "Monkey"}[fn(x) { x }];`, "unusable as hash key: FUNCTION"],
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

test("function application", () => {
  const tests: [string, number][] = [
    ["let identity = fn(x) { x; }; identity(5);", 5],
    ["let identity = fn(x) { return x; }; identity(5);", 5],
    ["let double = fn(x) { x * 2; }; double(5);", 10],
    ["let add = fn(x, y) { x + y; }; add(5, 5);", 10],
    ["let add = fn(x, y) { x + y; }; add(5 + 5, add(5, 5));", 20],
    ["fn(x) { x; }(5)", 5],
  ];
  for (const [input, expected] of tests) {
    testIntegerObject(testEval(input), expected);
  }
});

test("function enclosing environment", () => {
  const input = `
let first = 10;
let second = 10;
let third = 10;
let ourFunction = fn(first) {
  let second = 20;
  first + second + third;
};
ourFunction(20) + first + second;`;
  testIntegerObject(testEval(input), 70);
});

test("function objects", () => {
  const input = "fn(x) { x + 2}";
  const fn = testEval(input);
  assertClass(fn, FunctionObj);
  expect(fn.parameters.length).toBe(1);
  expect(fn.parameters[0].string).toBe("x");
  expect(fn.body.string).toBe("(x + 2)");
});

test("built-in functions", () => {
  const tests: [string, number | string | null | number[]][] = [
    [`len("")`, 0],
    [`len("four")`, 4],
    [`len("hello world")`, 11],
    [`len(1)`, "argument to 'len' not supported, got INTEGER"],
    [`len("one", "two")`, "wrong number of arguments. got=2, want=1"],
    [`len([1, 2, 3])`, 3],
    [`len([])`, 0],
    [`first([1, 2, 3])`, 1],
    [`first([])`, null],
    [`first(1)`, "argument to 'first' must be ARRAY, got INTEGER"],
    [`last([1, 2, 3])`, 3],
    [`last([])`, null],
    [`last(1)`, "argument to 'last' must be ARRAY, got INTEGER"],
    [`rest([1, 2, 3])`, [2, 3]],
    [`rest([])`, null],
    [`push([], 1)`, [1]],
    [`push(1, 1)`, "argument to 'push' must be ARRAY, got INTEGER"],
  ];

  for (const [input, expected] of tests) {
    const evaluated = testEval(input);
    switch (true) {
      case typeof expected === "number":
        testIntegerObject(evaluated, expected);
        break;
      case typeof expected === "string":
        assertClass(evaluated, ErrorObj);
        expect(evaluated.message).toBe(expected);
        break;

      case Array.isArray(expected):
        assertClass(evaluated, ArrayObj);
        expect(evaluated.elements.length).toBe(expected.length);
        for (const [idx, int] of expected.entries()) {
          testIntegerObject(evaluated.elements[idx], int);
        }
        break;
      case expected === null:
        testNullObject(evaluated);
    }
  }
});

test("array literal", () => {
  const input = "[1, 2 * 2, 3 + 3]";
  const arr = testEval(input);
  assertClass(arr, ArrayObj);
  expect(arr.elements.length).toBe(3);

  testIntegerObject(arr.elements[0], 1);
  testIntegerObject(arr.elements[1], 4);
  testIntegerObject(arr.elements[2], 6);
});

test("array index expressions", () => {
  const tests: [string, number | null][] = [
    ["[1, 2, 3][0]", 1],
    ["[1, 2, 3][1]", 2],
    ["[1, 2, 3][2]", 3],
    ["let i = 0; [1][i];", 1],
    ["[1, 2, 3][1 + 1];", 3],
    ["let myArray = [1, 2, 3]; myArray[2];", 3],
    ["let myArray = [1, 2, 3]; myArray[0] + myArray[1] + myArray[2];", 6],
    ["let myArray = [1, 2, 3]; let i = myArray[0]; myArray[i]", 2],
    ["[1, 2, 3][3]", null],
    ["[1, 2, 3][-1]", null],
  ];

  for (const [input, expected] of tests) {
    const evaluated = testEval(input);
    if (expected) {
      testIntegerObject(evaluated, expected);
    } else {
      testNullObject(evaluated);
    }
  }
});

test("hash literals", () => {
  const input = `let two = "two";
	{
		"one": 10 - 9,
		two: 1 + 1,
		"thr" + "ee": 6 / 2,
		4: 4,
		true: 5,
		false: 6
	}`;
  const evaluated = testEval(input);
  assertClass(evaluated, Hash);

  const expected = {
    [new StringObj("one").hashKey]: 1,
    [new StringObj("two").hashKey]: 2,
    [new StringObj("three").hashKey]: 3,
    [new Integer(4).hashKey]: 4,
    [TRUE.hashKey]: 5,
    [FALSE.hashKey]: 6,
  };

  expect(Object.keys(expected).length).toEqual(evaluated.pairs.size);
  for (const [expectedKey, expectedValue] of Object.entries(expected)) {
    const pair: HashPair | undefined = evaluated.pairs.get(
      expectedKey as HashKey,
    );
    if (!pair) {
      throw new Error("expected to find pair");
    }
    assertClass(pair.val, Integer);
    testIntegerObject(pair.val, expectedValue);
  }
});

test("hash index expressions", () => {
  const tests: [string, number | null][] = [
    [`{"foo": 5}["foo"]`, 5],
    [`{"foo": 5}["bar"]`, null],
    [`let key = "foo"; {"foo": 5}[key]`, 5],
    [`{}["foo"]`, null],
    [`{5: 5}[5]`, 5],
    [`{true: 5}[true]`, 5],
    [`{false: 5}[false]`, 5],
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
