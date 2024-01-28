import { expect, test } from "bun:test";
import { TokenType, Token } from "../token/token";
import { Lexer } from "./lexer";

test("Lexer nextToken", () => {
  const input = `=+(){},;`;

  const testCases: [TokenType, string][] = [
    [TokenType.ASSIGN, "="],
    [TokenType.PLUS, "+"],
    [TokenType.LPAREN, "("],
    [TokenType.RPAREN, ")"],
    [TokenType.LBRACE, "{"],
    [TokenType.RBRACE, "}"],
    [TokenType.COMMA, ","],
    [TokenType.SEMICOLON, ";"],
    [TokenType.EOF, ""],
  ];

  const lexer = new Lexer(input);

  for (let [i, testCase] of testCases.entries()) {
    const [expectedType, expectedLiteral] = testCase;
    const token = lexer.nextToken();
    expect(token.type).toBe(expectedType);
    expect(token.literal).toBe(expectedLiteral);
  }
});
