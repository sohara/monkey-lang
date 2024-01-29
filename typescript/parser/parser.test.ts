import { expect, test } from "bun:test";
import { Lexer } from "../lexer/lexer";
import { Parser } from "./parser";
import {
  ExpressionStatement,
  Identifier,
  IntegerLiteral,
  LetStatement,
  ReturnStatement,
} from "../ast/ast";

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
    expect((stmt as LetStatement).name.tokenLiteral).toBe(identifier);
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
  expect(program.statements[0]).toBeInstanceOf(ExpressionStatement);
  expect(
    (program.statements[0] as ExpressionStatement).expression,
  ).toBeInstanceOf(Identifier);
  expect(
    ((program.statements[0] as ExpressionStatement).expression as Identifier)
      .value,
  ).toBe("foobar");
  expect(
    (program.statements[0] as ExpressionStatement).expression.tokenLiteral,
  ).toBe("foobar");
});

test("integer literals", () => {
  const input = "5;";
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);

  const program = parser.parseProgram();
  checkParseErrors(parser);

  expect(program.statements.length).toBe(1);
  expect(program.statements[0]).toBeInstanceOf(ExpressionStatement);
  expect(
    (program.statements[0] as ExpressionStatement).expression,
  ).toBeInstanceOf(IntegerLiteral);
  expect(
    (
      (program.statements[0] as ExpressionStatement)
        .expression as IntegerLiteral
    ).value,
  ).toBe(5);
  expect(
    (
      (program.statements[0] as ExpressionStatement)
        .expression as IntegerLiteral
    ).tokenLiteral,
  ).toBe("5");
});

function checkParseErrors(parser: Parser) {
  const errors = parser.errors;
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`Parser error: ${error}`);
    }
    throw new Error(`Parser has ${errors.length} errors`);
  }
}
