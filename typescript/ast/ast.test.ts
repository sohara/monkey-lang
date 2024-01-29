import { expect, test } from "bun:test";
import { Identifier, LetStatement, Program } from "./ast";
import { Token, TokenType } from "../token/token";

test("string() methods", () => {
  const program = new Program();
  program.statements = [
    new LetStatement(
      new Token(TokenType.LET, "let"),
      new Identifier(new Token(TokenType.IDENT, "myVar"), "myVar"),
      new Identifier(new Token(TokenType.IDENT, "anotherVar"), "anotherVar"),
    ),
  ];

  expect(program.string).toBe(`let myVar = anotherVar;`);
});
