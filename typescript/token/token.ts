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
  MINUS: "-",
  BANG: "!",
  ASTERISK: "*",
  SLASH: "/",
  LT: "<",
  GT: ">",
} as const;

export type TokenType = (typeof TokenType)[keyof typeof TokenType];

const KEYWORDS = {
  fn: TokenType.FUNCTION,
  let: TokenType.LET,
} as const;

function isKeyOfKeywords(key: string): key is keyof typeof KEYWORDS {
  return Object.keys(KEYWORDS).includes(key);
}

export function lookupIdent(ident: string): TokenType {
  if (isKeyOfKeywords(ident)) {
    return KEYWORDS[ident];
  }
  return TokenType.IDENT;
}

export class Token {
  type: TokenType;
  literal: string;

  constructor(type: TokenType, literal: string) {
    this.type = type;
    this.literal = literal;
  }
}
