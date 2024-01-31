import {
  BooleanLiteral,
  Identifier,
  InfixExpression,
  IntegerLiteral,
  LetStatement,
  PrefixExpression,
  Program,
  ReturnStatement,
} from "../ast/ast";
import {
  type Statement,
  type Expression,
  ExpressionStatement,
} from "../ast/ast";
import type { Lexer } from "../lexer/lexer";
import { TokenType, Token } from "../token/token";

enum Precedence {
  LOWEST = 1,
  EQUALS, // Automatically becomes 2
  LESSGREATER, // Automatically becomes 3
  SUM, // Automatically becomes 4
  PRODUCT, // Automatically becomes 5
  PREFIX, // Automatically becomes 6
  CALL, // Automatically becomes 7
}

const precedences = {
  [TokenType.EQ]: Precedence.EQUALS,
  [TokenType.NOT_EQ]: Precedence.EQUALS,
  [TokenType.LT]: Precedence.LESSGREATER,
  [TokenType.GT]: Precedence.LESSGREATER,
  [TokenType.PLUS]: Precedence.SUM,
  [TokenType.MINUS]: Precedence.SUM,
  [TokenType.ASTERISK]: Precedence.PRODUCT,
  [TokenType.SLASH]: Precedence.PRODUCT,
} as const;

function isPrecedencesKey(
  key: string | undefined,
): key is keyof typeof precedences {
  return Object.keys(precedences).includes(key ?? "");
}

type PrefixParseFn = () => Expression | null;
type InfixParseFn = (exp: Expression) => Expression | null;

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
    this.registerPrefixParseFn(TokenType.BANG, this.parsePrefixExpression);
    this.registerPrefixParseFn(TokenType.MINUS, this.parsePrefixExpression);
    this.registerPrefixParseFn(TokenType.TRUE, this.parseBoolean);
    this.registerPrefixParseFn(TokenType.FALSE, this.parseBoolean);

    this.registerInfixParseFn(TokenType.PLUS, this.parseInfixExpression);
    this.registerInfixParseFn(TokenType.MINUS, this.parseInfixExpression);
    this.registerInfixParseFn(TokenType.SLASH, this.parseInfixExpression);
    this.registerInfixParseFn(TokenType.ASTERISK, this.parseInfixExpression);
    this.registerInfixParseFn(TokenType.EQ, this.parseInfixExpression);
    this.registerInfixParseFn(TokenType.NOT_EQ, this.parseInfixExpression);
    this.registerInfixParseFn(TokenType.LT, this.parseInfixExpression);
    this.registerInfixParseFn(TokenType.GT, this.parseInfixExpression);

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

  parseExpression(precedence: number): Expression | null {
    const tokenType = this.curToken?.type;
    const prefixFn = tokenType && this.prefixParseFns.get(tokenType);
    if (!prefixFn) {
      this.noPrefixParseFnError(tokenType);
      return null;
    }
    let leftExp: Expression | null;
    leftExp = prefixFn();

    while (
      leftExp &&
      !this.peekTokenIs(TokenType.SEMICOLON) &&
      precedence < this.peekPrecedence()
    ) {
      const infixFn = this.peekToken
        ? this.infixParseFns.get(this.peekToken.type)
        : null;
      if (!infixFn) {
        return leftExp;
      }
      this.nextToken();

      leftExp = infixFn(leftExp);
    }
    return leftExp;
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

  parseBoolean(): BooleanLiteral {
    const token = this.curToken ?? new Token(TokenType.FALSE, "false");
    return new BooleanLiteral(token, this.curTokenIs(TokenType.TRUE));
  }

  parsePrefixExpression(): Expression | null {
    const prefToken = this.curToken;
    if (prefToken) {
      this.nextToken();
      const right = this.parseExpression(Precedence.PREFIX);
      if (right) {
        const prefExpression = new PrefixExpression(
          prefToken,
          prefToken.literal,
          right,
        );

        return prefExpression;
      }
    }
    return null;
  }

  parseInfixExpression(left: Expression): Expression | null {
    const infixToken = this.curToken;
    if (infixToken) {
      const precedence = this.curPrecedence();
      this.nextToken();
      const right = this.parseExpression(precedence);
      if (right) {
        const infixExpression = new InfixExpression(
          infixToken,
          left,
          infixToken.literal,
          right,
        );

        return infixExpression;
      }
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

  registerInfixParseFn(tokenType: TokenType, fn: InfixParseFn) {
    this.infixParseFns.set(tokenType, fn.bind(this));
  }

  noPrefixParseFnError(tokenType?: TokenType) {
    const msg = `no prefix parse function for ${tokenType} found`;
    this.errors.push(msg);
  }

  peekPrecedence(): number {
    const type = this.peekToken?.type;
    if (isPrecedencesKey(type)) {
      const precedence = precedences[type];
      return precedence;
    }
    return Precedence.LOWEST;
  }

  curPrecedence(): number {
    const type = this.curToken?.type;
    if (isPrecedencesKey(type)) {
      const precedence = precedences[type];
      return precedence;
    }
    return Precedence.LOWEST;
  }
}
