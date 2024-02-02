import { expect, test } from "bun:test";
import { Lexer } from "../lexer/lexer";
import { Parser } from "./parser";
import {
  ExpressionStatement,
  Identifier,
  IntegerLiteral,
  LetStatement,
  PrefixExpression,
  ReturnStatement,
  type Expression,
  InfixExpression,
  BooleanLiteral,
  IfExpression,
  FunctionLiteral,
  CallExpression,
} from "../ast/ast";

type LiteralValue = number | boolean | string;

test("`let` statements", () => {
  const tests: [string, string, LiteralValue][] = [
    ["let x = 5;", "x", 5],
    ["let y = true;", "y", true],
    ["let foobar = y;", "foobar", "y"],
  ];

  for (const [input, expectedIdent, expectedValue] of tests) {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);

    const program = parser.parseProgram();
    checkParseErrors(parser);

    expect(program.statements.length).toBe(1);
    const statement = program.statements[0];

    assertClass(statement, LetStatement);
    testLetStatement(statement, expectedIdent);

    testLiteralExpression(statement.value, expectedValue);
  }
});

test("`return` statements", () => {
  const tests: [string, LiteralValue][] = [
    ["return 5;", 5],
    ["return true;", true],
    ["return foobar;", "foobar"],
  ];

  for (const [input, expectedValue] of tests) {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);

    const program = parser.parseProgram();
    checkParseErrors(parser);
    expect(program.statements.length).toBe(1);
    const retStatement = program.statements[0];
    assertClass(retStatement, ReturnStatement);

    expect(retStatement.tokenLiteral).toBe("return");
    testLiteralExpression(retStatement.returnValue, expectedValue);
  }
});

test("identifier expressions", () => {
  const input = "foobar;";
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);

  const program = parser.parseProgram();
  checkParseErrors(parser);

  expect(program.statements.length).toBe(1);
  assertClass(program.statements[0], ExpressionStatement);
  const expression = program.statements[0].expression;
  assertClass(expression, Identifier);
  expect(expression.value).toBe("foobar");
  expect(expression.tokenLiteral).toBe("foobar");
});

test("integer literals", () => {
  const input = "5;";
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);

  const program = parser.parseProgram();
  checkParseErrors(parser);

  expect(program.statements.length).toBe(1);
  assertClass(program.statements[0], ExpressionStatement);
  const expression = program.statements[0].expression;
  assertClass(expression, IntegerLiteral);
  expect(expression.value).toBe(5);
  expect(expression.tokenLiteral).toBe("5");
});

test("parsing prefix expressions", () => {
  const tests: [string, string, number][] = [
    ["!5;", "!", 5],
    ["-15;", "-", 15],
  ];

  for (let [input, operator, integerValue] of tests) {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);

    const program = parser.parseProgram();
    checkParseErrors(parser);

    expect(program.statements.length).toBe(1);
    assertClass(program.statements[0], ExpressionStatement);
    const expression = program.statements[0].expression;
    assertClass(expression, PrefixExpression);
    expect(expression.operator).toBe(operator);
    testIntegerLiteral(expression.right, integerValue);
  }
});

test("parsing infix expressions", () => {
  const tests: [string, LiteralValue, string, LiteralValue][] = [
    ["5 + 5;", 5, "+", 5],
    ["5 - 5;", 5, "-", 5],
    ["5 * 5;", 5, "*", 5],
    ["5 / 5;", 5, "/", 5],
    ["5 > 5;", 5, ">", 5],
    ["5 < 5;", 5, "<", 5],
    ["5 == 5;", 5, "==", 5],
    ["5 != 5;", 5, "!=", 5],
    ["true == true", true, "==", true],
    ["true != false", true, "!=", false],
    ["false == false", false, "==", false],
  ];

  for (let [input, leftValue, operator, rightValue] of tests) {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);

    const program = parser.parseProgram();
    checkParseErrors(parser);

    expect(program.statements.length).toBe(1);
    assertClass(program.statements[0], ExpressionStatement);
    const expression = program.statements[0].expression;
    assertClass(expression, InfixExpression);
    testInfixExpression(expression, leftValue, operator, rightValue);
  }
});

test("operator precedence in parsing", () => {
  const tests: [string, string][] = [
    ["-a * b", "((-a) * b)"],
    ["!-a", "(!(-a))"],
    ["a + b + c", "((a + b) + c)"],
    ["a + b - c", "((a + b) - c)"],
    ["a * b * c", "((a * b) * c)"],
    ["a * b / c", "((a * b) / c)"],
    ["a + b / c", "(a + (b / c))"],
    ["a + b * c + d / e - f", "(((a + (b * c)) + (d / e)) - f)"],
    ["3 + 4; -5 * 5", "(3 + 4)((-5) * 5)"],
    ["5 > 4 == 3 < 4", "((5 > 4) == (3 < 4))"],
    ["5 < 4 != 3 > 4", "((5 < 4) != (3 > 4))"],
    ["3 + 4 * 5 == 3 * 1 + 4 * 5", "((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))"],
    ["true", "true"],
    ["false", "false"],
    ["3 > 5 == false", "((3 > 5) == false)"],
    ["3 < 5 == true", "((3 < 5) == true)"],
    ["1 + (2 + 3) + 4", "((1 + (2 + 3)) + 4)"],
    ["(5 + 5) * 2", "((5 + 5) * 2)"],
    ["2 / (5 + 5)", "(2 / (5 + 5))"],
    ["(5 + 5) * 2 * (5 + 5)", "(((5 + 5) * 2) * (5 + 5))"],
    ["-(5 + 5)", "(-(5 + 5))"],
    ["!(true == true)", "(!(true == true))"],
    ["a + add(b * c) + d", "((a + add((b * c))) + d)"],
    [
      "add(a, b, 1, 2 * 3, 4 + 5, add(6, 7 * 8))",
      "add(a, b, 1, (2 * 3), (4 + 5), add(6, (7 * 8)))",
    ],
    ["add(a + b + c * d / f + g)", "add((((a + b) + ((c * d) / f)) + g))"],
  ];

  for (let [input, expected] of tests) {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);

    const program = parser.parseProgram();
    checkParseErrors(parser);

    const actual = program.string;
    expect(actual).toEqual(expected);
  }
});

test("boolean expressions", () => {
  const tests: [string, boolean][] = [
    ["true;", true],
    ["false;", false],
  ];
  for (let [input, expectedBoolean] of tests) {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);

    const program = parser.parseProgram();
    checkParseErrors(parser);

    expect(program.statements.length).toBe(1);
    assertClass(program.statements[0], ExpressionStatement);
    const expression = program.statements[0].expression;
    assertClass(expression, BooleanLiteral);
    expect(expression.value).toBe(expectedBoolean);
  }
});

test("`if` expressions", () => {
  const input = "if (x < y) { x }";
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);

  const program = parser.parseProgram();
  checkParseErrors(parser);

  expect(program.statements.length).toBe(1);
  const statement = program.statements[0];

  assertClass(statement, ExpressionStatement);
  assertClass(statement.expression, IfExpression);
  assertClass(statement.expression.condition, InfixExpression);

  testInfixExpression(statement.expression.condition, "x", "<", "y");

  expect(statement.expression.consequence?.statements.length).toBe(1);
  const consequence = statement.expression.consequence?.statements[0];
  assertClass(consequence, ExpressionStatement);

  testIdentifier(consequence.expression, "x");

  expect(statement.expression.alternative).toBeNull();
});

test("`if-else` expressions", () => {
  const input = "if (x < y) { x } else { y }";
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);

  const program = parser.parseProgram();
  checkParseErrors(parser);

  expect(program.statements.length).toBe(1);
  const statement = program.statements[0];

  assertClass(statement, ExpressionStatement);
  assertClass(statement.expression, IfExpression);
  assertClass(statement.expression.condition, InfixExpression);

  testInfixExpression(statement.expression.condition, "x", "<", "y");

  expect(statement.expression.consequence?.statements.length).toBe(1);
  const consequence = statement.expression.consequence?.statements[0];
  assertClass(consequence, ExpressionStatement);

  testIdentifier(consequence.expression, "x");

  expect(statement.expression.alternative?.statements.length).toBe(1);
  const alternative = statement.expression.alternative?.statements[0];
  assertClass(alternative, ExpressionStatement);
  testIdentifier(alternative.expression, "y");
});

test("function literal parsing", () => {
  const input = "fn(x, y) { x + y; }";
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);

  const program = parser.parseProgram();
  checkParseErrors(parser);

  expect(program.statements.length).toBe(1);
  const statement = program.statements[0];
  assertClass(statement, ExpressionStatement);

  const fl = statement.expression;
  assertClass(fl, FunctionLiteral);

  expect(fl.parameters.length).toBe(2);
  testLiteralExpression(fl.parameters[0], "x");
  testLiteralExpression(fl.parameters[1], "y");

  expect(fl.body?.statements.length).toBe(1);
  const bodyStatement = fl.body?.statements[0];
  assertClass(bodyStatement, ExpressionStatement);

  testInfixExpression(bodyStatement.expression, "x", "+", "y");
});

test("function parameter parsing", () => {
  const tests: [string, string[]][] = [
    ["fn() {};", []],
    ["fn(x) {}", ["x"]],
    ["fn(x, y, z) {}", ["x", "y", "z"]],
  ];

  for (const [input, expectedParams] of tests) {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);

    const program = parser.parseProgram();
    checkParseErrors(parser);

    const statement = program.statements[0];
    assertClass(statement, ExpressionStatement);

    const fl = statement.expression;
    assertClass(fl, FunctionLiteral);

    expect(fl.parameters.length).toBe(expectedParams.length);

    for (const [i, identifier] of expectedParams.entries()) {
      testLiteralExpression(fl.parameters[i], identifier);
    }
  }
});

test("call expression parsing", () => {
  const input = "add(1, 2 * 3, 4 + 5)";
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);

  const program = parser.parseProgram();
  checkParseErrors(parser);

  expect(program.statements.length).toBe(1);
  const statement = program.statements[0];
  assertClass(statement, ExpressionStatement);

  const callExp = statement.expression;
  assertClass(callExp, CallExpression);

  testIdentifier(callExp.fn, "add");
  expect(callExp.arguments.length).toBe(3);

  testLiteralExpression(callExp.arguments[0], 1);
  testInfixExpression(callExp.arguments[1], 2, "*", 3);
  testInfixExpression(callExp.arguments[2], 4, "+", 5);
});

test("call expression parameter parsing", () => {
  const tests: [string, string, string[]][] = [
    ["add();", "add", []],
    ["add(1);", "add", ["1"]],
    ["add(1, 2 * 3, 4 + 5);", "add", ["1", "(2 * 3)", "(4 + 5)"]],
  ];

  for (const [input, expectedIdent, expectArgs] of tests) {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);

    const program = parser.parseProgram();
    checkParseErrors(parser);
    const statement = program.statements[0];
    assertClass(statement, ExpressionStatement);

    const callExp = statement.expression;
    assertClass(callExp, CallExpression);

    testIdentifier(callExp.fn, expectedIdent);

    expect(callExp.arguments.length).toBe(expectArgs.length);

    for (const [i, arg] of expectArgs.entries()) {
      expect(callExp.arguments[i].string).toBe(arg);
    }
  }
});

function testIntegerLiteral(literal: Expression, expectedValue: number) {
  assertClass(literal, IntegerLiteral);
  expect(typeof literal.value).toBe("number");
  expect(literal.value).toBe(expectedValue);
  expect(literal.tokenLiteral).toBe(`${expectedValue}`);
}

function checkParseErrors(parser: Parser) {
  const errors = parser.errors;
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`Parser error: ${error}`);
    }
    throw new Error(`Parser has ${errors.length} errors`);
  }
}

function testInfixExpression(
  expression: Expression,
  expectedLeft: LiteralValue,
  expectedOperator: string,
  expectedRight: LiteralValue,
) {
  assertClass(expression, InfixExpression);
  testLiteralExpression(expression.left, expectedLeft);
  expect(expression.operator).toBe(expectedOperator);
  testLiteralExpression(expression.right, expectedRight);
}

function testLiteralExpression(
  expression: Expression | null,
  expected: LiteralValue,
) {
  if (!expression) {
    throw new Error("Literal expression is null");
  }

  switch (typeof expected) {
    case "string":
      return testIdentifier(expression, expected);
    case "number":
      return testIntegerLiteral(expression, expected);
    case "boolean":
      return testBoolean(expression, expected);
  }
}

function testBoolean(expression: Expression, expected: boolean) {
  assertClass(expression, BooleanLiteral);
  expect(expression.value).toBe(expected);
  expect(expression.tokenLiteral).toBe(`${expected}`);
}

function testIdentifier(expression: Expression, expected: string) {
  assertClass(expression, Identifier);
  expect(expression.value).toBe(expected);
  expect(expression.tokenLiteral).toBe(expected);
}

function testLetStatement(statement: LetStatement, name: string) {
  expect(statement.tokenLiteral).toBe("let");
  expect(statement.name.tokenLiteral).toBe(name);
}

export function assertClass<T>(
  expression: any,
  klass: new (...args: any[]) => T,
): asserts expression is T {
  if (!(expression instanceof klass)) {
    throw new Error(
      `Expected object to be an instance of ${
        klass.name
      }, but received ${typeof expression}.`,
    );
  }
}
