import { Identifier, LetStatement, Program, Statement } from "../ast/ast";
import type { Lexer } from "../lexer/lexer";
import { TokenType, type Token } from "../token/token";

export class Parser {
  lexer: Lexer;
  curToken: Token | null = null;
  peekToken: Token | null = null;

  constructor(lexer: Lexer) {
    this.lexer = lexer;
    this.nextToken();
    this.nextToken();
  }

  nextToken() {
    this.curToken = this.peekToken;
    this.peekToken = this.lexer.nextToken();
  }

  parseProgram(): Program {
    const program = new Program();
    program.statements = [];
    while (this.curToken?.type !== TokenType.EOF) {
      const statement = this.parseStatement();
      if (statement) {
        program.statements.push(statement);
      }
      this.nextToken();
    }
    return program;
  }

  parseStatement(): Statement | null {
    switch (this.curToken?.type) {
      case TokenType.LET:
        return this.parseLetStatement();
      default:
        return null;
    }
  }

  parseLetStatement(): LetStatement | null {
    let letStatement: LetStatement | null;
    const letToken = this.curToken;

    if (!this.expectPeek(TokenType.IDENT)) {
      return null;
    }

    const identToken = this.curToken;
    if (letToken && identToken) {
      const name = new Identifier(identToken, identToken.literal);
      letStatement = new LetStatement(letToken, name);
    } else {
      letStatement = null;
    }

    if (!this.expectPeek(TokenType.ASSIGN)) {
      return null;
    }
    // TODO: We're skipping the expressions until we
    // encounter a semicolon
    while (!this.curTokenIs(TokenType.SEMICOLON)) {
      this.nextToken();
    }

    return letStatement;
  }

  expectPeek(tokenType: TokenType): boolean {
    if (this.peekTokenIs(tokenType)) {
      this.nextToken();
      return true;
    } else {
      return false;
    }
  }

  peekTokenIs(tokenType: TokenType): boolean {
    return this.peekToken?.type === tokenType;
  }

  curTokenIs(tokenType: TokenType): boolean {
    return this.curToken?.type === tokenType;
  }
}
