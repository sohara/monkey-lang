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
} from "../ast/ast";

type LiteralValue = number | boolean | string;

test("`let` statements", () => {
  const input = `
let x = 5;
let y = 10;
let foobar = 838383;
`;
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);

  const program = parser.parseProgram();
  checkParseErrors(parser);
  const identifiers = ["x", "y", "foobar"];
  for (let [index, identifier] of identifiers.entries()) {
    const stmt = program.statements[index];
    expect(stmt.tokenLiteral).toBe("let");
    expect(stmt).toBeInstanceOf(LetStatement);
    assertClass(stmt, LetStatement);
    expect(stmt.name.tokenLiteral).toBe(identifier);
  }
});

test("`return` statements", () => {
  const input = `
return 5;
return 10;
return 993322;
`;
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);

  const program = parser.parseProgram();
  checkParseErrors(parser);

  expect(program.statements.length).toBe(3);
  for (let stmt of program.statements) {
    expect(stmt).toBeInstanceOf(ReturnStatement);
    expect(stmt.tokenLiteral).toBe("return");
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

function testLiteralExpression(expression: Expression, expected: LiteralValue) {
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

function assertClass<T>(
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
