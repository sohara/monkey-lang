// Assuming you have a similar structure for `Token` in TypeScript
import { Token } from "../token/token";

interface Node {
  tokenLiteral(): string;
}

export interface Statement extends Node {
  // Empty in TypeScript, serves as a "marker" interface
}

interface Expression extends Node {
  // Empty in TypeScript, serves as a "marker" interface
}

export class Program {
  statements: Statement[];

  constructor() {
    this.statements = [];
  }

  tokenLiteral(): string {
    if (this.statements.length > 0) {
      return this.statements[0].tokenLiteral();
    } else {
      return "";
    }
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

  tokenLiteral(): string {
    return this.token.literal;
  }
}

export class Identifier implements Expression {
  token: Token; // the token.IDENT token
  value: string;

  constructor(token: Token, value: string) {
    this.token = token;
    this.value = value;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }
}

export class ReturnStatement implements Statement {
  token: Token; // the 'return' statement
  returnValue: Expression | null;

  constructor(token: Token, returnValue?: Expression) {
    this.token = token;
    this.returnValue = returnValue ?? null;
  }
  tokenLiteral(): string {
    return this.token.literal;
  }
}
