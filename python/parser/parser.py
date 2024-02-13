from enum import Enum, auto
from typing import Callable
from typing_extensions import Dict
from lexer.lexer import Lexer
from monkey_ast.ast import (
    Expression,
    ExpressionStatement,
    Identifier,
    LetStatement,
    Program,
    ReturnStatement,
)
from monkey_token.token import Token, TokenType


class Precedence(Enum):
    LOWEST = auto()
    EQUALS = auto()  # ==
    LESSGREATER = auto()  # > or <
    SUM = auto()  # +
    PRODUCT = auto()  # *
    PREFIX = auto()  # -x or !x
    CALL = auto()  # myFunction(x)


class Parser:
    def __init__(self, lexer: Lexer):
        self.lexer = lexer
        self.errors = []
        self.prefix_parse_fns: Dict[TokenType, Callable[[], Expression]] = {}
        self.infix_parse_fns: Dict[TokenType, Callable[[Expression], Expression]] = {}

        self.register_prefix_fn(TokenType.IDENT, self.parse_identifier)

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
            case TokenType.RETURN:
                return self.parse_return_statement()
            case _:
                return self.parse_expression_statement()

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

    def parse_return_statement(self):
        statement = ReturnStatement(self.cur_token)

        # Skipping expressions until we find a semicolon
        while not self.cur_token_is(TokenType.SEMICOLON):
            self.next_token()

        return statement

    def parse_expression_statement(self):
        statement = ExpressionStatement(self.cur_token)
        statement.expression = self.parse_expression(Precedence.LOWEST)

        if self.peek_token_is(TokenType.SEMICOLON):
            self.next_token()

        return statement

    def parse_expression(self, precedence: Precedence):
        prefix_fn = self.prefix_parse_fns[self.cur_token.type]
        if not prefix_fn:
            return None

        left_exp = prefix_fn()

        return left_exp

    def parse_identifier(self):
        return Identifier(self.cur_token, self.cur_token.literal)

    def peek_token_is(self, token_type: TokenType):
        return self.peek_token.type == token_type

    def cur_token_is(self, token_type: TokenType):
        return self.cur_token.type == token_type

    def expect_peek(self, token_type: TokenType):
        if self.peek_token_is(token_type):
            self.next_token()
            return True
        else:
            self.peek_error(token_type)
            return False

    def peek_error(self, token_type: TokenType):
        message = (
            f"expected next token to be {self.peek_token}, got {token_type} instead"
        )
        self.errors.append(message)

    def register_prefix_fn(self, token_type: TokenType, fn: Callable[[], Expression]):
        self.prefix_parse_fns[token_type] = fn
