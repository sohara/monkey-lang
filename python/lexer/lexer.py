from monkey_token.token import Token, TokenType


class Lexer:
    def __init__(self, input):
        print("input", input)
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
        match self.ch:
            case "=":
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
            case None:
                token = Token(TokenType.EOF, "")

        print("token", token)
        self.read_char()
        return token
