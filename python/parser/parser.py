from typing_extensions import Optional
from monkey_token.token import Token, TokenType
from monkey_ast.ast import Identifier, LetStatement, Program
from lexer.lexer import Lexer


class Parser:
    def __init__(self, lexer: Lexer):
        self.lexer = lexer
        self.cur_token: Token = Token(TokenType.ILLEGAL, "")
        self.peek_token: Token = Token(TokenType.ILLEGAL, "")
        self.next_token()
        self.next_token()

    def next_token(self):
        self.cur_token = self.peek_token
        self.peek_token = self.lexer.next_token()

    def parse_program(self):
        program = Program()
        while self.cur_token and self.cur_token.type != TokenType.EOF:
            statement = self.parse_statement()
            if statement:
                program.statements.append(statement)
            self.next_token()
        return program

    def parse_statement(self):
        match self.cur_token and self.cur_token.type:
            case TokenType.LET:
                return self.parse_let_statement()
            case _:
                return None

    def parse_let_statement(self):
        statement = LetStatement(self.cur_token)

        if not self.expect_peek(TokenType.IDENT):
            return None

        statement.name = Identifier(self.cur_token, self.cur_token.literal)

        if not self.expect_peek(TokenType.ASSIGN):
            return None

        # Skipping expressions until we find a semicolon
        while not self.cur_token_is(TokenType.SEMICOLON):
            self.next_token()

        return statement

    def peek_token_is(self, token_type: TokenType):
        return self.peek_token.type == token_type

    def cur_token_is(self, token_type: TokenType):
        return self.cur_token.type == token_type

    def expect_peek(self, token_type: TokenType):
        if self.peek_token_is(token_type):
            self.next_token()
            return True
        else:
            return False
