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
  TRUE: "TRUE",
  FALSE: "FALSE",
  IF: "IF",
  ELSE: "ELSE",
  RETURN: "RETURN",
  MINUS: "-",
  BANG: "!",
  ASTERISK: "*",
  SLASH: "/",
  LT: "<",
  GT: ">",
  EQ: "==",
  NOT_EQ: "!=",
} as const;

export type TokenType = (typeof TokenType)[keyof typeof TokenType];

const KEYWORDS = {
  fn: TokenType.FUNCTION,
  let: TokenType.LET,
  true: TokenType.TRUE,
  false: TokenType.FALSE,
  if: TokenType.IF,
  else: TokenType.ELSE,
  return: TokenType.RETURN,
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
