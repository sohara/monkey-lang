from enum import Enum


class TokenType(Enum):
    ILLEGAL = "ILLEGAL"
    EOF = "EOF"
    IDENT = "IDENT"  # add, foobar, x, y, ...
    INT = "INT"
    ASSIGN = "="
    PLUS = "+"
    COMMA = ","
    SEMICOLON = ";"
    LPAREN = "("
    RPAREN = ")"
    LBRACE = "{"
    RBRACE = "}"
    FUNCTION = "FUNCTION"
    LET = "LET"
    TRUE = "TRUE"
    FALSE = "FALSE"
    IF = "IF"
    ELSE = "ELSE"
    RETURN = "RETURN"
    MINUS = "-"
    BANG = "!"
    ASTERISK = "*"
    SLASH = "/"
    LT = "<"
    GT = ">"
    EQ = "=="
    NOT_EQ = "!="


KEYWORDS = {
    "fn": TokenType.FUNCTION,
    "let": TokenType.LET,
    "true": TokenType.TRUE,
    "false": TokenType.FALSE,
    "if": TokenType.IF,
    "else": TokenType.ELSE,
    "return": TokenType.RETURN,
}


def lookup_ident(ident: str):
    return KEYWORDS.get(ident, TokenType.IDENT)


class Token:
    def __init__(self, token_type: TokenType, literal: str):
        self.type = token_type
        self.literal = literal

    def __repr__(self):
        return f"Token(type={self.type}, literal={self.literal})"
