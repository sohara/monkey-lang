import {
  ArrayLiteral,
  BlockStatement,
  BooleanLiteral,
  CallExpression,
  FunctionLiteral,
  HashLiteral,
  Identifier,
  IfExpression,
  IndexExpression,
  InfixExpression,
  IntegerLiteral,
  LetStatement,
  PrefixExpression,
  Program,
  ReturnStatement,
  StringLiteral,
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
  INDEX,
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
  [TokenType.LPAREN]: Precedence.CALL,
  [TokenType.LBRACKET]: Precedence.INDEX,
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
    this.registerPrefixParseFn(TokenType.STRING, this.parseStringLiteral);
    this.registerPrefixParseFn(TokenType.BANG, this.parsePrefixExpression);
    this.registerPrefixParseFn(TokenType.MINUS, this.parsePrefixExpression);
    this.registerPrefixParseFn(TokenType.TRUE, this.parseBoolean);
    this.registerPrefixParseFn(TokenType.FALSE, this.parseBoolean);
    this.registerPrefixParseFn(TokenType.LPAREN, this.parseGroupedExpression);
    this.registerPrefixParseFn(TokenType.IF, this.parseIfExpression);
    this.registerPrefixParseFn(TokenType.FUNCTION, this.parseFunctionLiteral);
    this.registerPrefixParseFn(TokenType.LBRACKET, this.parseArrayLiteral);
    this.registerPrefixParseFn(TokenType.LBRACE, this.parseHashLiteral);

    this.registerInfixParseFn(TokenType.PLUS, this.parseInfixExpression);
    this.registerInfixParseFn(TokenType.MINUS, this.parseInfixExpression);
    this.registerInfixParseFn(TokenType.SLASH, this.parseInfixExpression);
    this.registerInfixParseFn(TokenType.ASTERISK, this.parseInfixExpression);
    this.registerInfixParseFn(TokenType.EQ, this.parseInfixExpression);
    this.registerInfixParseFn(TokenType.NOT_EQ, this.parseInfixExpression);
    this.registerInfixParseFn(TokenType.LT, this.parseInfixExpression);
    this.registerInfixParseFn(TokenType.GT, this.parseInfixExpression);
    this.registerInfixParseFn(TokenType.LPAREN, this.parseCallExpression);
    this.registerInfixParseFn(TokenType.LBRACKET, this.parseIndexExpression);

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

    if (!letStatement || !this.expectPeek(TokenType.ASSIGN)) {
      return null;
    }

    this.nextToken();

    letStatement.value = this.parseExpression(Precedence.LOWEST);

    if (this.peekTokenIs(TokenType.SEMICOLON)) {
      this.nextToken();
    }

    return letStatement;
  }

  parseReturnStatement(): ReturnStatement | null {
    if (!this.curToken) {
      return null;
    }
    const returnStatement = new ReturnStatement(this.curToken);
    this.nextToken();

    returnStatement.returnValue = this.parseExpression(Precedence.LOWEST);

    if (this.peekTokenIs(TokenType.SEMICOLON)) {
      this.nextToken();
    }
    return returnStatement;
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

  parseStringLiteral(): StringLiteral | null {
    if (this.curToken) {
      return new StringLiteral(this.curToken, this.curToken.literal);
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

  parseGroupedExpression(): Expression | null {
    this.nextToken();

    const exp = this.parseExpression(Precedence.LOWEST);

    if (!this.expectPeek(TokenType.RPAREN)) {
      return null;
    }

    return exp;
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

  parseIfExpression(): Expression | null {
    const token = this.curToken;
    if (!token) {
      return null;
    }
    const expression = new IfExpression(token);

    if (!this.expectPeek(TokenType.LPAREN)) {
      return null;
    }

    this.nextToken();

    expression.condition = this.parseExpression(Precedence.LOWEST);

    if (!this.expectPeek(TokenType.RPAREN)) {
      return null;
    }

    if (!this.expectPeek(TokenType.LBRACE)) {
      return null;
    }

    expression.consequence = this.parseBlockStatement();

    if (this.peekTokenIs(TokenType.ELSE)) {
      this.nextToken();

      if (!this.expectPeek(TokenType.LBRACE)) {
        return null;
      }

      expression.alternative = this.parseBlockStatement();
    }

    return expression;
  }

  parseBlockStatement(): BlockStatement | null {
    const token = this.curToken;
    if (!token) {
      return null;
    }

    const block = new BlockStatement(token, []);

    this.nextToken();

    while (
      !this.curTokenIs(TokenType.RBRACE) &&
      !this.curTokenIs(TokenType.EOF)
    ) {
      const statement = this.parseStatement();
      if (statement) {
        block.statements.push(statement);
      }
      this.nextToken();
    }
    return block;
  }

  parseFunctionLiteral(): Expression | null {
    const token = this.curToken;
    if (!token) {
      return null;
    }

    const literal = new FunctionLiteral(token);

    if (!this.expectPeek(TokenType.LPAREN)) {
      return null;
    }

    literal.parameters = this.parseFunctionParameters();

    if (!this.expectPeek(TokenType.LBRACE)) {
      return null;
    }

    literal.body = this.parseBlockStatement();

    return literal;
  }

  parseFunctionParameters(): Identifier[] {
    const identifiers: Identifier[] = [];
    if (this.peekTokenIs(TokenType.RPAREN)) {
      this.nextToken();
      return identifiers;
    }

    this.nextToken();
    const token = this.curToken;
    if (!token) {
      return identifiers;
    }
    const ident = new Identifier(token, token.literal);
    identifiers.push(ident);

    while (this.peekTokenIs(TokenType.COMMA)) {
      this.nextToken();
      this.nextToken();
      const newToken = this.curToken;
      if (!newToken) {
        return identifiers;
      }
      const ident = new Identifier(newToken, newToken.literal);
      identifiers.push(ident);
    }

    if (!this.expectPeek(TokenType.RPAREN)) {
      return [];
    }

    return identifiers;
  }

  parseCallExpression(fn: Expression): Expression | null {
    const token = this.curToken;
    if (!token) {
      return null;
    }
    const callExp = new CallExpression(token, fn);
    callExp.arguments = this.parseExpressionList(TokenType.RPAREN);
    return callExp;
  }

  parseExpressionList(end: TokenType): Expression[] {
    const list: Expression[] = [];

    if (this.peekTokenIs(end)) {
      this.nextToken();
      return list;
    }

    this.nextToken();
    const firstItem = this.parseExpression(Precedence.LOWEST);
    if (!firstItem) {
      return list;
    }
    list.push(firstItem);

    while (this.peekTokenIs(TokenType.COMMA)) {
      this.nextToken();
      this.nextToken();
      const item = this.parseExpression(Precedence.LOWEST);
      if (!item) {
        return list;
      }
      list.push(item);
    }

    if (!this.expectPeek(end)) {
      return list;
    }

    return list;
  }

  parseArrayLiteral(): Expression | null {
    const token = this.curToken;
    if (!token) {
      return null;
    }

    const array = new ArrayLiteral(token);

    array.elements = this.parseExpressionList(TokenType.RBRACKET);

    return array;
  }

  parseHashLiteral(): Expression | null {
    const token = this.curToken;
    if (!token) {
      return null;
    }
    const hash = new HashLiteral(token);

    while (!this.peekTokenIs(TokenType.RBRACE)) {
      this.nextToken();
      const key = this.parseExpression(Precedence.LOWEST);

      if (!this.expectPeek(TokenType.COLON)) {
        return null;
      }

      this.nextToken();

      const value = this.parseExpression(Precedence.LOWEST);
      if (!key || !value) {
        return null;
      }

      hash.pairs.set(key, value);

      if (
        !this.peekTokenIs(TokenType.RBRACE) &&
        !this.expectPeek(TokenType.COMMA)
      ) {
        return null;
      }
    }

    if (!this.expectPeek(TokenType.RBRACE)) {
      return null;
    }

    return hash;
  }

  parseIndexExpression(left: Expression): Expression | null {
    const token = this.curToken;
    if (!token) {
      return null;
    }
    const indexExp = new IndexExpression(token, left);

    this.nextToken();
    indexExp.index = this.parseExpression(Precedence.LOWEST);

    if (!this.expectPeek(TokenType.RBRACKET)) {
      return null;
    }

    return indexExp;
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
