import {
  Identifier,
  IntegerLiteral,
  LetStatement,
  Program,
  ReturnStatement,
} from "../ast/ast";
import {
  type Statement,
  type Expression,
  ExpressionStatement,
} from "../ast/ast";
import type { Lexer } from "../lexer/lexer";
import { TokenType, type Token } from "../token/token";

enum Precedence {
  LOWEST = 1,
  EQUALS, // Automatically becomes 2
  LESSGREATER, // Automatically becomes 3
  SUM, // Automatically becomes 4
  PRODUCT, // Automatically becomes 5
  PREFIX, // Automatically becomes 6
  CALL, // Automatically becomes 7
}

type PrefixParseFn = () => Expression | null;
type InfixParseFn = (exp: Expression) => Expression;

export class Parser {
  lexer: Lexer;
  curToken: Token | null = null;
  peekToken: Token | null = null;
  errors: string[] = [];
  prefixParseFns: Map<TokenType, PrefixParseFn>;
  infixParseFns: Map<TokenType, InfixParseFn>;

  constructor(lexer: Lexer) {
    this.lexer = lexer;
    this.prefixParseFns = new Map();
    this.infixParseFns = new Map();
    this.registerPrefixParseFn(TokenType.IDENT, this.parseIdentifier);
    this.registerPrefixParseFn(TokenType.INT, this.parseIntegerLiteral);

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
      case TokenType.RETURN:
        return this.parseReturnStatement();
      default:
        return this.parseExpressionStatement();
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

  parseReturnStatement(): ReturnStatement | null {
    if (this.curToken) {
      const returnStatement = new ReturnStatement(this.curToken);
      this.nextToken();

      // TODO: We're skipping the expressions until we
      // encounter a semicolon
      while (!this.curTokenIs(TokenType.SEMICOLON)) {
        this.nextToken();
      }
      return returnStatement;
    }

    return null;
  }

  parseExpressionStatement(): ExpressionStatement | null {
    const statementToken = this.curToken;
    const expression = this.parseExpression(Precedence.LOWEST);
    if (statementToken && expression) {
      const statement = new ExpressionStatement(statementToken, expression);

      if (this.peekTokenIs(TokenType.SEMICOLON)) {
        this.nextToken();
      }

      return statement;
    }
    return null;
  }

  parseExpression(_: number): Expression | null {
    const tokenType = this.curToken?.type;
    if (tokenType) {
      const prefixFn = this.prefixParseFns.get(tokenType);
      if (prefixFn) {
        const leftExp = prefixFn();
        return leftExp;
      }
    }
    return null;
  }

  parseIdentifier(): Expression | null {
    if (this.curToken) {
      return new Identifier(this.curToken, this.curToken?.literal);
    }
    return null;
  }

  parseIntegerLiteral(): IntegerLiteral | null {
    const curToken = this.curToken;
    if (curToken) {
      const value = parseInt(this.curToken?.literal ?? "");
      if (typeof value !== "number" || isNaN(value)) {
        this.errors.push(`could not parse ${curToken.literal} as integer`);
        return null;
      }
      const literal = new IntegerLiteral(curToken, value);
      return literal;
    }
    return null;
  }

  expectPeek(tokenType: TokenType): boolean {
    if (this.peekTokenIs(tokenType)) {
      this.nextToken();
      return true;
    } else {
      this.peekError(tokenType);
      return false;
    }
  }

  peekTokenIs(tokenType: TokenType): boolean {
    return this.peekToken?.type === tokenType;
  }

  curTokenIs(tokenType: TokenType): boolean {
    return this.curToken?.type === tokenType;
  }

  peekError(tokenType: TokenType) {
    const msg = `Expected next token to be ${tokenType}, got ${this.peekToken?.type}`;
    this.errors.push(msg);
  }

  registerPrefixParseFn(tokenType: TokenType, fn: PrefixParseFn) {
    this.prefixParseFns.set(tokenType, fn.bind(this));
  }
}
