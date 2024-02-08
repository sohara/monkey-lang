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


class Token:
    def __init__(self, token_type: TokenType, literal: str):
        self.type = token_type
        self.literal = literal

    def __repr__(self):
        return f"Token(type={self.type}, literal={self.literal})"
