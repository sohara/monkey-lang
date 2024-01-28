import { Token, TokenType } from "../token/token";

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
      this.position = this.readPosition;
      this.readPosition += 1;
    }
  }

  nextToken(): Token {
    let token: Token = { type: TokenType.EOF, literal: "" };

    switch (this.ch) {
      case "=":
        token = newToken(TokenType.ASSIGN, this.ch);
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
      case "+":
        token = newToken(TokenType.PLUS, this.ch);
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
    }

    this.readChar();
    return token;
  }
}

function newToken(tokenType: TokenType, ch: string) {
  return new Token(tokenType, ch);
}
