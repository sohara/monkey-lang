// Assuming you have a similar structure for `Token` in TypeScript
import { Token } from "../token/token";

export interface Node {
  tokenLiteral: string;
  string: string;
}

export interface Statement extends Node {
  // Empty in TypeScript, serves as a "marker" interface
}

export interface Expression extends Node {
  // Empty in TypeScript, serves as a "marker" interface
}

export class Program implements Node {
  statements: Statement[];

  constructor() {
    this.statements = [];
  }

  get tokenLiteral(): string {
    if (this.statements.length > 0) {
      return this.statements[0].tokenLiteral;
    } else {
      return "";
    }
  }

  get string(): string {
    return this.statements.map((s) => s.string).join("");
  }
}

export class LetStatement implements Statement {
  token: Token; // the token.LET token
  name: Identifier;
  value: Expression | null;

  constructor(token: Token, name: Identifier, value?: Expression) {
    this.token = token;
    this.name = name;
    this.value = value ?? null;
  }

  get tokenLiteral(): string {
    return this.token.literal;
  }

  get string() {
    return `${this.tokenLiteral} ${this.name.string} = ${
      this.value?.string ?? ""
    };`;
  }
}

export class Identifier implements Expression {
  token: Token; // the token.IDENT token
  value: string;

  constructor(token: Token, value: string) {
    this.token = token;
    this.value = value;
  }

  get tokenLiteral(): string {
    return this.token.literal;
  }

  get string() {
    return this.value;
  }
}

export class ReturnStatement implements Statement {
  token: Token; // the 'return' statement
  returnValue: Expression | null;

  constructor(token: Token, returnValue?: Expression) {
    this.token = token;
    this.returnValue = returnValue ?? null;
  }
  get tokenLiteral(): string {
    return this.token.literal;
  }

  get string() {
    return `${this.tokenLiteral} ${this.returnValue?.string ?? ""};`;
  }
}

export class ExpressionStatement implements Statement {
  token: Token;
  expression: Expression;

  constructor(token: Token, expression: Expression) {
    this.token = token;
    this.expression = expression;
  }

  get tokenLiteral() {
    return this.token.literal;
  }

  get string() {
    return `${this.expression.string}`;
  }
}

export class BlockStatement implements Statement {
  token: Token;
  statements: Statement[];

  constructor(token: Token, statements: Statement[]) {
    this.token = token;
    this.statements = statements;
  }

  get tokenLiteral() {
    return this.token.literal;
  }

  get string(): string {
    return this.statements.map((s) => s.string).join("");
  }
}

export class IntegerLiteral implements Expression {
  token: Token;
  value: number;

  constructor(token: Token, value: number) {
    this.token = token;
    this.value = value;
  }

  get tokenLiteral() {
    return this.token.literal;
  }

  get string() {
    return this.token.literal;
  }
}

export class StringLiteral implements Expression {
  token: Token;
  value: string;

  constructor(token: Token, value: string) {
    this.token = token;
    this.value = value;
  }

  get tokenLiteral() {
    return this.token.literal;
  }

  get string() {
    return this.token.literal;
  }
}

export class BooleanLiteral implements Expression {
  token: Token;
  value: boolean;

  constructor(token: Token, value: boolean) {
    this.token = token;
    this.value = value;
  }

  get tokenLiteral() {
    return this.token.literal;
  }

  get string() {
    return this.token.literal;
  }
}

export class PrefixExpression implements Expression {
  token: Token;
  operator: string;
  right: Expression;

  constructor(token: Token, operator: string, right: Expression) {
    this.token = token;
    this.operator = operator;
    this.right = right;
  }

  get tokenLiteral() {
    return this.token.literal;
  }

  get string() {
    return `(${this.operator}${this.right.string})`;
  }
}

export class InfixExpression implements Expression {
  token: Token;
  left: Expression;
  operator: string;
  right: Expression;

  constructor(
    token: Token,
    left: Expression,
    operator: string,
    right: Expression,
  ) {
    this.token = token;
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  get tokenLiteral() {
    return this.token.literal;
  }

  get string() {
    return `(${this.left.string} ${this.operator} ${this.right.string})`;
  }
}

export class IfExpression implements Expression {
  token: Token;
  condition: Expression | null;
  consequence: BlockStatement | null;
  alternative: BlockStatement | null;

  constructor(
    token: Token,
    condition?: Expression,
    consequence?: BlockStatement,
    alternative?: BlockStatement,
  ) {
    this.token = token;
    this.condition = condition ?? null;
    this.consequence = consequence ?? null;
    this.alternative = alternative ?? null;
  }

  get tokenLiteral() {
    return this.token.literal;
  }

  get string() {
    return `if (${this.condition?.string})${this.consequence?.string}`;
  }
}

export class FunctionLiteral implements Expression {
  token: Token;
  parameters: Identifier[];
  body: BlockStatement | null;
  name: string;

  constructor(token: Token) {
    this.token = token;
    this.parameters = [];
    this.body = null;
    this.name = "";
  }

  get tokenLiteral() {
    return this.token.literal;
  }

  get string() {
    return `${this.tokenLiteral}${
      this.name ? this.name : ""
    }(${this.parameters.join(", ")}) ${this.body?.string}`;
  }
}

export class CallExpression implements Expression {
  token: Token;
  fn: Expression;
  arguments: Expression[];

  constructor(token: Token, fn: Expression) {
    this.token = token;
    this.fn = fn;
    this.arguments = [];
  }

  get tokenLiteral() {
    return this.token.literal;
  }

  get string() {
    return `${this.fn.string}(${this.arguments
      .map((a) => a.string)
      .join(", ")})`;
  }
}
