from types import NoneType
from monkey_token.token import Token, TokenType, lookup_ident


class Lexer:
    def __init__(self, input):
        self.input = input
        self.position = 0
        self.read_position = 0
        self.ch = ""
        self.read_char()

    def read_char(self):
        if self.read_position >= len(self.input):  # Use len() for string length
            self.ch = None  # Or use "" if you prefer an empty string to signify the end
        else:
            self.ch = self.input[self.read_position]
            self.position = self.read_position
            self.read_position += 1

    def next_token(self):
        token = None
        self.skip_whitespace()
        match self.ch:
            case "=":
                if self.peek_char() == "=":
                    ch = self.ch
                    self.read_char()
                    literal = ch + self.ch
                    token = Token(TokenType.EQ, literal)
                else:
                    token = Token(TokenType.ASSIGN, self.ch)
            case ";":
                token = Token(TokenType.SEMICOLON, self.ch)
            case "(":
                token = Token(TokenType.LPAREN, self.ch)
            case ")":
                token = Token(TokenType.RPAREN, self.ch)
            case ",":
                token = Token(TokenType.COMMA, self.ch)
            case "+":
                token = Token(TokenType.PLUS, self.ch)
            case "{":
                token = Token(TokenType.LBRACE, self.ch)
            case "}":
                token = Token(TokenType.RBRACE, self.ch)
            case "+":
                token = Token(TokenType.PLUS, self.ch)
            case "-":
                token = Token(TokenType.MINUS, self.ch)
            case "!":
                if self.peek_char() == "=":
                    ch = self.ch
                    self.read_char()
                    literal = ch + self.ch
                    token = Token(TokenType.NOT_EQ, literal)
                else:
                    token = Token(TokenType.BANG, self.ch)
            case "/":
                token = Token(TokenType.SLASH, self.ch)
            case "*":
                token = Token(TokenType.ASTERISK, self.ch)
            case "<":
                token = Token(TokenType.LT, self.ch)
            case ">":
                token = Token(TokenType.GT, self.ch)
            case None:
                token = Token(TokenType.EOF, "")
            case _:
                if is_letter(self.ch):
                    literal = self.read_identifier()
                    type = lookup_ident(literal)
                    return Token(type, literal)
                elif is_digit(self.ch):
                    literal = self.read_number()
                    return Token(TokenType.INT, literal)

        self.read_char()
        return token

    def read_identifier(self):
        position = self.position
        while is_letter(self.ch):
            self.read_char()
        return self.input[position : self.position]

    def read_number(self):
        position = self.position
        while is_digit(self.ch):
            self.read_char()
        return self.input[position : self.position]

    def skip_whitespace(self):
        while self.ch == " " or self.ch == "\t" or self.ch == "\n" or self.ch == "\r":
            self.read_char()

    def peek_char(self):
        if self.read_position >= len(self.input):
            return None
        else:
            return self.input[self.read_position]


def is_letter(ch: str | None):
    if not ch or len(ch) != 1:
        return False

    code = ord(ch)
    return (
        (code >= 65 and code <= 90)  # A-Z
        or (code >= 97 and code <= 122)  # a-z
        or code == 95  # underscore (_)
    )


def is_digit(ch: str | None):
    if not ch or len(ch) != 1:
        return False
    code = ord(ch)
    return code >= 48 and code <= 57
