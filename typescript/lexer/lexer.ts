import { Token, TokenType, lookupIdent } from "../token/token";

export class Lexer {
  input: string;

  position: number = 0; // current position in input (points to current char)
  readPosition: number = 0; // current reading position in input (after current char)
  ch: string | 0 = ""; // curent character under examination

  constructor(input: string) {
    this.input = input;
    this.readChar();
  }

  readChar() {
    if (this.readPosition >= this.input.length) {
      this.ch = 0;
    } else {
      this.ch = this.input.charAt(this.readPosition);
    }
    this.position = this.readPosition;
    this.readPosition += 1;
  }

  nextToken(): Token {
    let token: Token = { type: TokenType.ILLEGAL, literal: "" };
    this.skipWhitespace();

    switch (this.ch) {
      case "=":
        if (this.peekChar() === "=") {
          const ch = this.ch;
          this.readChar();
          const literal = ch + this.ch;
          token = newToken(TokenType.EQ, literal);
        } else {
          token = newToken(TokenType.ASSIGN, this.ch);
        }
        break;
      case "+":
        token = newToken(TokenType.PLUS, this.ch);
        break;
      case "-":
        token = newToken(TokenType.MINUS, this.ch);
        break;
      case "!":
        if (this.peekChar() === "=") {
          const ch = this.ch;
          this.readChar();
          const literal = ch + this.ch;
          token = newToken(TokenType.NOT_EQ, literal);
        } else {
          token = newToken(TokenType.BANG, this.ch);
        }
        break;
      case "/":
        token = newToken(TokenType.SLASH, this.ch);
        break;
      case "*":
        token = newToken(TokenType.ASTERISK, this.ch);
        break;
      case "<":
        token = newToken(TokenType.LT, this.ch);
        break;
      case ">":
        token = newToken(TokenType.GT, this.ch);
        break;
      case ";":
        token = newToken(TokenType.SEMICOLON, this.ch);
        break;
      case "(":
        token = newToken(TokenType.LPAREN, this.ch);
        break;
      case ")":
        token = newToken(TokenType.RPAREN, this.ch);
        break;
      case ",":
        token = newToken(TokenType.COMMA, this.ch);
        break;
      case "{":
        token = newToken(TokenType.LBRACE, this.ch);
        break;
      case "}":
        token = newToken(TokenType.RBRACE, this.ch);
        break;
      case 0:
        token = { type: TokenType.EOF, literal: "" };
        break;
      default:
        if (isLetter(this.ch)) {
          token.literal = this.readIdentifier();
          token.type = lookupIdent(token.literal);
          return token;
        } else if (isDigit(this.ch)) {
          token.type = TokenType.INT;
          token.literal = this.readNumber();
          return token;
        }
    }

    this.readChar();
    return token;
  }

  peekChar() {
    if (this.readPosition >= this.input.length) {
      return 0;
    } else {
      return this.input.charAt(this.readPosition);
    }
  }

  readIdentifier() {
    const position = this.position;
    while (isLetter(this.ch)) {
      this.readChar();
    }
    return this.input.slice(position, this.position);
  }

  readNumber() {
    const position = this.position;
    while (isDigit(this.ch)) {
      this.readChar();
    }
    return this.input.slice(position, this.position);
  }

  skipWhitespace() {
    while (
      this.ch === " " ||
      this.ch === "\t" ||
      this.ch === "\n" ||
      this.ch === "\r"
    ) {
      this.readChar();
    }
  }
}

function isLetter(ch: string | 0): boolean {
  if (ch === 0 || ch.length !== 1) return false;

  const code = ch.charCodeAt(0);
  return (
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) || // a-z
    code === 95
  ); // underscore (_)
}

function isDigit(ch: string | 0): boolean {
  if (ch === 0 || ch.length !== 1) return false;
  const code = ch.charCodeAt(0);
  return code >= 48 && code <= 57;
}

function newToken(tokenType: TokenType, ch: string) {
  return new Token(tokenType, ch);
}
