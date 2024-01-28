export const TokenType = {
  ILLEGAL: "ILLEGAL",
  EOF: "EOF",
  IDENT: "IDENT", // add, foobar, x, y
  INT: "INT",
  ASSIGN: "=",
  PLUS: "+",
  COMMA: ",",
  SEMICOLON: ";",
  LPAREN: "(",
  RPAREN: ")",
  LBRACE: "{",
  RBRACE: "}",
  FUNCTION: "FUNCTION",
  LET: "LET",
} as const;

export type TokenType = (typeof TokenType)[keyof typeof TokenType];

export class Token {
  type: TokenType;
  literal: string;

  constructor(type: TokenType, literal: string) {
    this.type = type;
    this.literal = literal;
  }
}
